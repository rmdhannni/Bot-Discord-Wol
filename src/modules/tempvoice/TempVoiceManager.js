import { ChannelType } from 'discord.js';
import { TempVoiceChannel } from './TempVoiceChannel.js';
import { TempVoiceController, TV_BUTTON_IDS, TV_MODAL_IDS } from './TempVoiceController.js';

/**
 * TempVoiceManager — Mengatur sistem "Join to Create" dan siklus room temp voice.
 */
export class TempVoiceManager {
  constructor(client, store) {
    this.client = client;
    this.store = store;
    this.channelFactory = new TempVoiceChannel();
    this.controller = new TempVoiceController();

    /** voiceChannelId -> TempVoiceChannelState */
    this.activeChannels = new Map();
    /** voiceChannelId -> Array of message IDs */
    this.panelMessages = new Map();
  }

  register() {
    this.client.on('voiceStateUpdate', (oldState, newState) =>
      this.onVoiceStateUpdate(oldState, newState),
    );

    this.client.on('interactionCreate', (interaction) =>
      this.onInteractionCreate(interaction),
    );

    this.client.on('messageCreate', (message) =>
      this.onMessageCreate(message),
    );
  }

  getStateByOwner(userId) {
    return [...this.activeChannels.values()].find((s) => s.owner.id === userId);
  }

  async sendPanelToChannel(textChannel, state) {
    const msg = await this.controller.sendControlPanel(textChannel, state);

    const existing = this.panelMessages.get(state.channel.id) || [];
    existing.push(msg.id);
    this.panelMessages.set(state.channel.id, existing);

    state.controlPanelChannel = textChannel;
    state.controlPanelMessageId = msg.id;
  }

  async onVoiceStateUpdate(oldState, newState) {
    try {
      await this.handleMemberJoin(newState);
      await this.handleMemberLeave(oldState);
    } catch (error) {
      console.error('[TempVoiceManager] voiceStateUpdate error:', error);
    }
  }

  async onMessageCreate(message) {
    if (message.author.bot || !message.guild) return;
    const content = message.content.trim().toLowerCase();

    // Trigger chat: "control panel" atau "kontrol panel"
    if (content === 'control panel' || content === 'kontrol panel') {
      const state = this.getStateByOwner(message.author.id);
      if (!state) {
        await message.reply({
          content: '❌ Kamu tidak memiliki room voice aktif saat ini. Masuk ke channel **Join to Create** terlebih dahulu untuk membuat room.',
        });
        return;
      }

      await this.sendPanelToChannel(message.channel, state);
    }
  }

  async onInteractionCreate(interaction) {
    try {
      if (interaction.isButton()) {
        const isTvButton = Object.values(TV_BUTTON_IDS).includes(interaction.customId);
        if (!isTvButton) return;

        const state = this.findStateForInteraction(interaction);
        if (!state) {
          await interaction.reply({
            content: '⚠️ Room tidak ditemukan atau telah ditutup.',
            ephemeral: true,
          });
          return;
        }

        await this.controller.handleButton(interaction, state, this);
        return;
      }

      if (interaction.isModalSubmit()) {
        const isTvModal = Object.values(TV_MODAL_IDS).includes(interaction.customId);
        if (!isTvModal) return;

        const state = this.getStateByOwner(interaction.user.id);
        if (!state) {
          await interaction.reply({
            content: '⚠️ Room kamu tidak ditemukan.',
            ephemeral: true,
          });
          return;
        }

        await this.controller.handleModal(interaction, state);
      }
    } catch (error) {
      console.error('[TempVoiceManager] interactionCreate error:', error);
    }
  }

  async handleMemberJoin(newState) {
    if (!newState.member || newState.member.user.bot) return;

    const guildId = newState.guild.id;
    const settings = this.store.get(guildId);
    if (!settings?.tempvoice?.enabled) return;

    const hubChannelId = settings.tempvoice.hubChannelId;
    if (!hubChannelId || newState.channelId !== hubChannelId) return;

    const owner = newState.member;

    // Jika owner sudah punya room aktif, langsung pindahkan kembali ke roomnya
    const existing = this.getStateByOwner(owner.id);
    if (existing && existing.channel) {
      await owner.voice.setChannel(existing.channel);
      return;
    }

    // Buat room baru
    const partial = await this.channelFactory.createTempChannel(
      owner,
      settings.tempvoice.categoryId,
      settings.tempvoice.channelNameTemplate,
      settings.tempvoice.defaultLimit,
    );

    // Cari text channel untuk mengirim panel
    const panelTextChannel = await this.resolvePanelTextChannel(
      guildId,
      settings.tempvoice.voicePanelChannelId,
      partial.channel,
    );

    let panelMessage = null;
    if (panelTextChannel) {
      panelMessage = await this.controller.sendControlPanel(panelTextChannel, partial);
    }

    const state = {
      ...partial,
      controlPanelChannel: panelTextChannel,
      controlPanelMessageId: panelMessage?.id || '',
    };

    this.activeChannels.set(partial.channel.id, state);

    if (panelMessage) {
      this.panelMessages.set(partial.channel.id, [panelMessage.id]);
    }

    console.log(`[TempVoiceManager] Room dibuat: "${partial.channel.name}" untuk ${owner.user.username}`);
  }

  async handleMemberLeave(oldState) {
    if (!oldState.channelId) return;

    const state = this.activeChannels.get(oldState.channelId);
    if (!state) return;

    // Cek apakah ada manusia yang tersisa di room
    const nonBotMembers = state.channel.members.filter((m) => !m.user.bot);
    if (nonBotMembers.size > 0) return;

    // Room kosong -> bersihkan dan hapus
    await this.cleanupTempChannel(oldState.channelId, state);
  }

  async cleanupTempChannel(channelId, state) {
    this.activeChannels.delete(channelId);
    this.panelMessages.delete(channelId);
    await this.channelFactory.deleteTempChannel(state.channel);
    console.log(`[TempVoiceManager] Room dihapus: ${channelId}`);
  }

  findStateForInteraction(interaction) {
    // 1. Cari by message id
    if (interaction.message?.id) {
      for (const [channelId, msgIds] of this.panelMessages.entries()) {
        if (msgIds.includes(interaction.message.id)) {
          return this.activeChannels.get(channelId);
        }
      }
    }

    // 2. Cari by voice channel id member
    const memberVoiceId = interaction.member?.voice?.channelId;
    if (memberVoiceId && this.activeChannels.has(memberVoiceId)) {
      return this.activeChannels.get(memberVoiceId);
    }

    // 3. Cari by owner
    return this.getStateByOwner(interaction.user.id);
  }

  async resolvePanelTextChannel(guildId, configuredChannelId, voiceChannel) {
    // 1. Gunakan channel yang diset via /setup
    if (configuredChannelId) {
      try {
        const ch = await this.client.channels.fetch(configuredChannelId);
        if (ch && ch.isTextBased()) return ch;
      } catch {
        // Fallback
      }
    }

    // 2. Gunakan text chat dari voice channel itu sendiri jika diizinkan
    if (voiceChannel && voiceChannel.isTextBased && voiceChannel.isTextBased()) {
      return voiceChannel;
    }

    // 3. Fallback ke system channel
    const guild = voiceChannel.guild;
    if (guild.systemChannel) return guild.systemChannel;

    // 4. Cari channel teks pertama
    const firstText = guild.channels.cache.find(
      (ch) => ch.type === ChannelType.GuildText && ch.permissionsFor(guild.members.me)?.has('SendMessages'),
    );
    return firstText || null;
  }
}
