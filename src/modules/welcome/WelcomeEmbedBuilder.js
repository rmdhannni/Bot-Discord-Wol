import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  ThumbnailBuilder,
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

  buildContainer(member, options, type) {
    const map = this.buildPlaceholderMap(member);

    const defaultTitle = type === 'welcome'
      ? '👋 Welcome to {server}!'
      : '💔 Goodbye from {server}';
    const defaultDesc = type === 'welcome'
      ? 'Hey {user}, welcome aboard! You are member **#{count}**.\nEnjoy your stay and read the rules.'
      : '**{user}** has left the server. We now have **{count}** members.';
    const defaultFooter = type === 'welcome' ? 'User ID: {userId}' : 'They will be missed.';

    const rawTitle  = options?.title       || defaultTitle;
    const rawDesc   = options?.description || defaultDesc;
    const rawFooter = options?.footer      || defaultFooter;
    const imageUrl  = options?.imageUrl    || '';

    const titleResolved  = this.resolve(rawTitle,  map);
    const descResolved   = this.resolve(rawDesc,   map);
    const footerResolved = this.resolve(rawFooter, map);

    // Avatar URL member (256px PNG)
    const avatarUrl = member?.user?.displayAvatarURL?.({ extension: 'png', size: 256 })
      ?? member?.displayAvatarURL?.({ extension: 'png', size: 256 })
      ?? 'https://cdn.discordapp.com/embed/avatars/0.png';

    const userMention = typeof member?.toString === 'function' ? member.toString() : '';

    // Body teks utama
    let bodyText = type === 'welcome'
      ? `${userMention ? userMention + '\n' : ''}## ${titleResolved}\n\n${descResolved}`
      : `## ${titleResolved}\n\n${descResolved}`;

    if (imageUrl && imageUrl.trim().startsWith('http')) {
      bodyText += `\n[​](${imageUrl.trim()})`;
    }

    // Section dengan avatar thumbnail di kanan
    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(bodyText),
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(avatarUrl),
      );

    const container = new ContainerBuilder()
      .addSectionComponents(section)
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ${footerResolved}`),
      );

    return container;
  }

  buildPlaceholderMap(member) {
    const guild      = member?.guild;
    const count      = guild?.memberCount ? guild.memberCount.toString() : '1';
    const userStr    = typeof member?.toString === 'function' ? member.toString() : (member?.user?.username || 'Member');
    const username   = member?.user?.username || member?.displayName || 'Member';
    const serverName = guild?.name || 'Server';
    const userId     = member?.user?.id || member?.id || '0';

    return {
      '{user}':     userStr,
      '{username}': username,
      '{server}':   serverName,
      '{count}':    count,
      '{userId}':   userId,
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
