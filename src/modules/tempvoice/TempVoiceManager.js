import { MessageFlags, ChannelType, PermissionFlagsBits } from 'discord.js';
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
    /** voiceChannelId -> Timeout jeda hapus saat kosong */
    this.leaveTimers = new Map();
    /** Set user ID yang sedang dalam proses membuat room (mencegah double-create karena race condition) */
    this.creatingUsers = new Set();
    /**
     * Debounce map: userId -> timestamp of last room creation.
     * Blokir join hub dalam 8 detik setelah room dibuat untuk mencegah
     * double-create akibat Discord mengirim voiceStateUpdate ganda.
     */
    this.joinCooldowns = new Map();
  }

  getActiveRoomsCount(guildId) {
    if (!guildId) return this.activeChannels.size;
    let count = 0;
    for (const state of this.activeChannels.values()) {
      if (state.channel?.guild?.id === guildId) {
        count++;
      }
    }
    return count;
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

        const state = await this.findStateForInteraction(interaction);
        if (!state) {
          await interaction.reply({
            content: '⚠️ Room tidak ditemukan atau telah ditutup.',
            flags: MessageFlags.Ephemeral,
          }).catch(() => {});
          return;
        }

        await this.controller.handleButton(interaction, state, this);
        return;
      }

      if (interaction.isModalSubmit()) {
        const isTvModal = Object.values(TV_MODAL_IDS).includes(interaction.customId);
        if (!isTvModal) return;

        const state = (await this.findStateForInteraction(interaction)) || this.getStateByOwner(interaction.user.id);
        if (!state) {
          await interaction.reply({
            content: '⚠️ Room kamu tidak ditemukan.',
            flags: MessageFlags.Ephemeral,
          }).catch(() => {});
          return;
        }

        await this.controller.handleModal(interaction, state);
      }
    } catch (error) {
      if (error.code === 10062 || error.code === 40060) return;
      console.error('[TempVoiceManager] interactionCreate error:', error);
    }
  }

  async handleMemberJoin(newState) {
    if (!newState.member || newState.member.user.bot) return;

    // Jika member masuk ke room yang sedang dalam hitungan mundur leaveTimer, batalkan timer
    if (newState.channelId && this.leaveTimers.has(newState.channelId)) {
      clearTimeout(this.leaveTimers.get(newState.channelId));
      this.leaveTimers.delete(newState.channelId);
    }

    const guildId = newState.guild.id;
    const settings = this.store.get(guildId);
    if (!settings?.tempvoice?.enabled) return;

    const hubChannelId = settings.tempvoice.hubChannelId;
    if (!hubChannelId || newState.channelId !== hubChannelId) return;

    // --- Debounce: tolak join dalam 8 detik setelah terakhir membuat room ---
    const lastJoin = this.joinCooldowns.get(newState.member.id) || 0;
    if (Date.now() - lastJoin < 8000) return;

    const owner = newState.member;

    // Mutex lock: tolak jika sedang dalam proses pembuatan room
    if (this.creatingUsers.has(owner.id)) return;
    this.creatingUsers.add(owner.id);

    try {
      // Jika owner sudah punya room aktif, langsung pindahkan kembali ke roomnya
      const existing = this.getStateByOwner(owner.id);
      if (existing && existing.channel) {
        // Pastikan channel masih ada di Discord (belum dihapus)
        const liveChannel = newState.guild.channels.cache.get(existing.channel.id);
        if (liveChannel) {
          if (this.leaveTimers.has(existing.channel.id)) {
            clearTimeout(this.leaveTimers.get(existing.channel.id));
            this.leaveTimers.delete(existing.channel.id);
          }
          try {
            await owner.voice.setChannel(liveChannel);
          } catch (err) {
            console.warn('[TempVoiceManager] Gagal pindah ke existing room:', err.message);
            // Channel sudah tidak valid, hapus state lama
            this.activeChannels.delete(existing.channel.id);
          }
          return;
        } else {
          // Channel sudah tidak ada, bersihkan state lama
          this.activeChannels.delete(existing.channel.id);
          this.leaveTimers.delete(existing.channel.id);
        }
      }


      // Cek batas kuota maksimal room tempvoice (0 = Unlimited)
      const maxRooms = settings.tempvoice.maxRooms || 0;
      if (maxRooms > 0) {
        const currentCount = this.getActiveRoomsCount(guildId);
        if (currentCount >= maxRooms) {
          try {
            await owner.voice.disconnect('Batas maksimal room tempvoice tercapai.');
            await owner.send({
              content: `⚠️ Maaf, batas kuota pembuatan room temporary voice di server **${newState.guild.name}** telah penuh (Maksimal: **${maxRooms}** room).\nSilakan coba lagi nanti ketika ada room yang selesai digunakan.`,
            }).catch(() => {});
          } catch (err) {
            console.warn('[TempVoiceManager] Gagal disconnect member melebihi limit:', err);
          }
          return;
        }
      }

      // Tandai waktu pembuatan room (debounce guard)
      this.joinCooldowns.set(owner.id, Date.now());

      // Buat room baru
      const partial = await this.channelFactory.createTempChannel(
        owner,
        settings.tempvoice.categoryId,
        settings.tempvoice.channelNameTemplate,
        settings.tempvoice.defaultLimit,
      );

      // Kirim panel ke text chat dalam voice channel itu sendiri
      let panelMessage = null;
      const voiceChannel = partial.channel;
      if (voiceChannel && voiceChannel.isTextBased && voiceChannel.isTextBased()) {
        panelMessage = await this.controller.sendControlPanel(voiceChannel, partial);
      }

      const state = {
        ...partial,
        controlPanelChannel: panelMessage ? voiceChannel : null,
        controlPanelMessageId: panelMessage?.id || '',
      };

      // Daftarkan ke activeChannels SEBELUM mutex dilepas
      this.activeChannels.set(partial.channel.id, state);

      if (panelMessage) {
        this.panelMessages.set(partial.channel.id, [panelMessage.id]);
      }

      console.log(`[TempVoiceManager] Room dibuat: "${partial.channel.name}" untuk ${owner.user.username}`);
    } catch (error) {
      console.error('[TempVoiceManager] Gagal memproses pembuatan room:', error);
      // Reset cooldown jika gagal agar user bisa mencoba lagi
      this.joinCooldowns.delete(owner.id);
    } finally {
      this.creatingUsers.delete(owner.id);
      // Cooldown otomatis bersih setelah 8 detik (hanya jika tidak di-reset oleh error)
      setTimeout(() => this.joinCooldowns.delete(owner.id), 8000);
    }
  }

  async handleMemberLeave(oldState) {
    if (!oldState.channelId) return;

    const state = this.activeChannels.get(oldState.channelId);
    if (!state) return;

    // Cek apakah ada manusia yang tersisa di room
    let nonBotCount = 0;
    try {
      const liveCh = state.channel?.guild?.channels?.cache?.get(state.channel.id) || state.channel;
      nonBotCount = liveCh.members?.filter((m) => !m.user.bot).size || 0;
    } catch {
      nonBotCount = 0;
    }

    if (nonBotCount > 0) return;

    // Room kosong -> beri grace period (120 detik) sebelum auto-delete
    // Selama periode ini, fitur tombol di chat tetap aktif dan owner bisa mengelola atau menghapus room
    if (this.leaveTimers.has(oldState.channelId)) {
      clearTimeout(this.leaveTimers.get(oldState.channelId));
    }

    const timer = setTimeout(async () => {
      this.leaveTimers.delete(oldState.channelId);
      const curState = this.activeChannels.get(oldState.channelId);
      if (!curState) return;

      try {
        const curCh = curState.channel?.guild?.channels?.cache?.get(curState.channel.id) || curState.channel;
        const curCount = curCh.members?.filter((m) => !m.user.bot).size || 0;
        if (curCount === 0) {
          await this.cleanupTempChannel(oldState.channelId, curState);
        }
      } catch {
        await this.cleanupTempChannel(oldState.channelId, curState);
      }
    }, 120000); // 2 menit jeda

    this.leaveTimers.set(oldState.channelId, timer);
  }

  async cleanupTempChannel(channelId, state) {
    if (this.leaveTimers.has(channelId)) {
      clearTimeout(this.leaveTimers.get(channelId));
      this.leaveTimers.delete(channelId);
    }
    this.activeChannels.delete(channelId);
    this.panelMessages.delete(channelId);
    await this.channelFactory.deleteTempChannel(state.channel);
    console.log(`[TempVoiceManager] Room dihapus: ${channelId}`);
  }

  async findStateForInteraction(interaction) {
    // 1. Cek langsung dari interaction.channelId (paling akurat saat interaksi di text chat voice channel)
    if (interaction.channelId && this.activeChannels.has(interaction.channelId)) {
      return this.activeChannels.get(interaction.channelId);
    }

    // 2. Cari by message id panel
    if (interaction.message?.id) {
      for (const [channelId, msgIds] of this.panelMessages.entries()) {
        if (msgIds.includes(interaction.message.id)) {
          const s = this.activeChannels.get(channelId);
          if (s) return s;
        }
      }
    }

    // 3. Cari by voice channel id member saat ini
    const memberVoiceId = interaction.member?.voice?.channelId;
    if (memberVoiceId && this.activeChannels.has(memberVoiceId)) {
      return this.activeChannels.get(memberVoiceId);
    }

    // 4. Cari by owner user id
    const byOwner = this.getStateByOwner(interaction.user.id);
    if (byOwner) return byOwner;

    // 5. Cek apakah interaksi terjadi di channel milik room aktif
    for (const state of this.activeChannels.values()) {
      if (state.channel?.id === interaction.channelId) {
        return state;
      }
    }

    // 6. Auto-recovery jika bot baru restart dan channel voice masih ada di Discord
    if (interaction.channel && (interaction.channel.type === ChannelType.GuildVoice || interaction.channel.isVoiceBased?.())) {
      const settings = this.store.get(interaction.guildId);
      const isInCategory = settings?.tempvoice?.categoryId
        ? interaction.channel.parentId === settings.tempvoice.categoryId
        : true;

      if (isInCategory) {
        let ownerMember = null;
        try {
          for (const [id, overwrite] of interaction.channel.permissionOverwrites.cache.entries()) {
            if (overwrite.type === 1 && overwrite.allow.has(PermissionFlagsBits.ManageChannels)) {
              ownerMember = await interaction.guild.members.fetch(id).catch(() => null);
              if (ownerMember) break;
            }
          }
        } catch {}

        if (!ownerMember) {
          ownerMember = interaction.member;
        }

        const recoveredState = {
          channel: interaction.channel,
          owner: ownerMember,
          isLocked: false,
          isWaitingRoom: false,
          isHidden: false,
          createdAt: Date.now(),
          controlPanelChannel: interaction.channel,
          controlPanelMessageId: interaction.message?.id || '',
        };

        this.activeChannels.set(interaction.channel.id, recoveredState);
        console.log(`[TempVoiceManager] Room state di-recover: "${interaction.channel.name}" untuk ${ownerMember.user?.username || ownerMember.id}`);
        return recoveredState;
      }
    }

    return null;
  }

}
