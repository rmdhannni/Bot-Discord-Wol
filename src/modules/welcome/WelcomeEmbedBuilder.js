import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} from 'discord.js';

/**
 * WelcomeEmbedBuilder — membangun Container V2 untuk welcome dan goodbye.
 * Menampilkan avatar member sebagai thumbnail di kanan menggunakan SectionBuilder.
 */
export class WelcomeEmbedBuilder {
  /**
   * Builds a Container V2 for a joining member.
   * @returns {ContainerBuilder}
   */
  buildWelcomeContainer(member, options) {
    return this.buildContainer(member, options, 'welcome');
  }

  /**
   * Builds a Container V2 for a leaving member.
   * @returns {ContainerBuilder}
   */
  buildGoodbyeContainer(member, options) {
    return this.buildContainer(member, options, 'goodbye');
  }

  // Aliases agar caller lama tidak break
  buildWelcomeEmbed(member, options) { return this.buildWelcomeContainer(member, options); }
  buildGoodbyeEmbed(member, options) { return this.buildGoodbyeContainer(member, options); }

  getImageUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value.trim());
      if (!['http:', 'https:'].includes(url.protocol) || url.toString().length > 2048) return null;
      return url.toString();
    } catch {
      return null;
    }
  }

  buildImageGallery(imageUrl, description) {
    const url = this.getImageUrl(imageUrl);
    if (!url) return null;
    return new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder().setURL(url).setDescription(description),
    );
  }

  buildContainer(member, options, type) {
    if ((Array.isArray(options?.layout) && options.layout.length)
      || (typeof options?.layout === 'string' && options.layout.trim())) {
      return this.buildLayoutContainer(member, options, type);
    }

    const map = this.buildPlaceholderMap(member);

    const defaultTitle = type === 'welcome'
      ? '👋 Welcome to {server}!'
      : '💔 Goodbye from {server}';
    const defaultDesc = type === 'welcome'
      ? 'Hey {user}, welcome aboard! You are member **#{count}**.\nEnjoy your stay and read the rules.'
      : '**{user}** has left the server. We now have **{count}** members.';
    const defaultFooter = type === 'welcome'
      ? 'User ID: {userId}'
      : 'They will be missed.';

    const rawTitle = options?.title || defaultTitle;
    const rawDesc = options?.description || defaultDesc;
    const rawFooter = options?.footer ?? defaultFooter;
    const imageUrl = options?.imageUrl || '';

    const titleResolved = this.resolve(rawTitle, map);
    const descResolved = this.resolve(rawDesc, map);
    const footerResolved = this.resolve(rawFooter, map);

    // Avatar URL member (256px PNG)
    const avatarUrl = member?.user?.displayAvatarURL?.({ extension: 'png', size: 256 })
      ?? member?.displayAvatarURL?.({ extension: 'png', size: 256 })
      ?? 'https://cdn.discordapp.com/embed/avatars/0.png';

    // Body teks utama
    let bodyText = `## ${titleResolved}\n\n${descResolved}`;

    const bodyParts = bodyText.split('{separator}').slice(0, 4);

    // Section dengan avatar thumbnail di kanan
    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(bodyParts[0] || ''),
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(avatarUrl),
      );

    const container = new ContainerBuilder()
      .setAccentColor(
        Number.parseInt(
          (/^#[0-9a-fA-F]{6}$/.test(options?.color || '')
            ? options.color
            : type === 'welcome' ? '#5865F2' : '#ED4245').slice(1),
          16,
        ),
      )
      .addSectionComponents(section);

    for (const part of bodyParts.slice(1)) {
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      if (part.trim()) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(part.trim()));
      }
    }

    if (footerResolved.trim()) {
      container
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# ${footerResolved}`),
        );
    }

    const imageGallery = this.buildImageGallery(imageUrl, `${type} banner`);
    if (imageGallery) container.addMediaGalleryComponents(imageGallery);

    return container;
  }

  parseLayout(layout) {
    const blocks = [];
    let currentBlock = null;

    for (const rawLine of String(layout || '').split(/\r?\n/)) {
      const line = rawLine.trimEnd();
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentBlock && currentBlock.type !== 'separator') currentBlock.content += '\n';
        continue;
      }

      if (/^SEPARATOR$/i.test(trimmed)) {
        blocks.push({ type: 'separator' });
        currentBlock = null;
        continue;
      }

      const directive = trimmed.match(/^(HEADER|TEXT|FOOTER)\s*:\s*(.*)$/i);
      if (directive) {
        currentBlock = { type: directive[1].toLowerCase(), content: directive[2] };
        blocks.push(currentBlock);
        continue;
      }

      if (currentBlock && currentBlock.type !== 'separator') {
        currentBlock.content += `${currentBlock.content ? '\n' : ''}${line}`;
      } else {
        currentBlock = { type: 'text', content: trimmed };
        blocks.push(currentBlock);
      }
    }

    const expanded = [];
    for (const block of blocks) {
      if (block.type === 'separator') {
        expanded.push(block);
        continue;
      }

      const parts = block.content.split('{separator}');
      parts.forEach((part, index) => {
        if (part.trim()) expanded.push({ type: block.type, content: part.trim() });
        if (index < parts.length - 1) expanded.push({ type: 'separator' });
      });
    }
    return expanded;
  }

  buildLayoutContainer(member, options, type) {
    const map = this.buildPlaceholderMap(member);
    const blocks = Array.isArray(options.layout)
      ? options.layout
      : this.parseLayout(options.layout);
    const avatarUrl = member?.user?.displayAvatarURL?.({ extension: 'png', size: 256 })
      ?? member?.displayAvatarURL?.({ extension: 'png', size: 256 })
      ?? 'https://cdn.discordapp.com/embed/avatars/0.png';
    const color = /^#[0-9a-fA-F]{6}$/.test(options.color || '')
      ? options.color
      : type === 'welcome' ? '#5865F2' : '#ED4245';
    const container = new ContainerBuilder().setAccentColor(Number.parseInt(color.slice(1), 16));
    let avatarAttached = false;

    for (const block of blocks) {
      if (block.type === 'separator') {
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
        continue;
      }

      const resolved = this.resolve(block.content, map);
      const content = block.type === 'header'
        ? `## ${resolved}`
        : block.type === 'footer' ? `-# ${resolved}` : resolved;
      const textDisplay = new TextDisplayBuilder().setContent(content);

      if (!avatarAttached) {
        const section = new SectionBuilder()
          .addTextDisplayComponents(textDisplay)
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarUrl));
        container.addSectionComponents(section);
        avatarAttached = true;
      } else {
        container.addTextDisplayComponents(textDisplay);
      }
    }

    const imageGallery = this.buildImageGallery(options.imageUrl, `${type} banner`);
    if (imageGallery) container.addMediaGalleryComponents(imageGallery);

    return container;
  }

  buildPlaceholderMap(member) {
    const guild = member?.guild;
    const count = guild?.memberCount ? guild.memberCount.toString() : '1';
    const userStr = typeof member?.toString === 'function' ? member.toString() : (member?.user?.username || 'Member');
    const username = member?.user?.username || member?.displayName || 'Member';
    const serverName = guild?.name || 'Server';
    const userId = member?.user?.id || member?.id || '0';

    return {
      '{user}': userStr,
      '{username}': username,
      '{server}': serverName,
      '{count}': count,
      '{userId}': userId,
    };
  }

  resolve(template, map) {
    if (!template) return '';
    let result = template;
    for (const [key, value] of Object.entries(map)) {
      result = result.replaceAll(key, value);
    }
    return result;
  }
}
