import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags,
} from 'discord.js';

export const TV_BUTTON_IDS = {
  // Row 1
  NAME: 'tv_btn_name',
  LIMIT: 'tv_btn_limit',
  PRIVACY: 'tv_btn_privacy',
  WAITING_ROOM: 'tv_btn_waiting_room',
  CHAT: 'tv_btn_chat',
  // Row 2
  TRUST: 'tv_btn_trust',
  UNTRUST: 'tv_btn_untrust',
  INVITE: 'tv_btn_invite',
  KICK: 'tv_btn_kick',
  REGION: 'tv_btn_region',
  // Row 3
  BLOCK: 'tv_btn_block',
  UNBLOCK: 'tv_btn_unblock',
  CLAIM: 'tv_btn_claim',
  TRANSFER: 'tv_btn_transfer',
  DELETE: 'tv_btn_delete',
  // Row 4
  LOCK: 'tv_btn_lock',
  ACTIVITY: 'tv_btn_activity',
  STATS: 'tv_btn_stats',
  TOPIC: 'tv_btn_topic',
  NOTIFY: 'tv_btn_notify',
};

export const TV_MODAL_IDS = {
  RENAME: 'tv_modal_name',
  LIMIT: 'tv_modal_limit',
  TRUST: 'tv_modal_trust',
  UNTRUST: 'tv_modal_untrust',
  INVITE: 'tv_modal_invite',
  KICK: 'tv_modal_kick',
  BLOCK: 'tv_modal_block',
  UNBLOCK: 'tv_modal_unblock',
  TRANSFER: 'tv_modal_transfer',
  TOPIC: 'tv_modal_topic',
};

/**
 * TempVoiceController — Mengatur tampilan UI panel kontrol (Gambar 1)
 * serta menangani semua aksi tombol dan popup modalnya.
 */
export class TempVoiceController {
  buildControlRows() {
    // Row 1: NAME · LIMIT · PRIVACY · WAITING ROOM · CHAT
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.NAME).setEmoji('🔀').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.LIMIT).setEmoji('👥').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.PRIVACY).setEmoji('🛡️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.WAITING_ROOM).setEmoji('⏱️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.CHAT).setEmoji('💬').setStyle(ButtonStyle.Secondary),
    );

    // Row 2: TRUST · UNTRUST · INVITE · KICK · REGION
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.TRUST).setEmoji('👤').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.UNTRUST).setEmoji('🚫').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.INVITE).setEmoji('📞').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.KICK).setEmoji('👢').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.REGION).setEmoji('🌐').setStyle(ButtonStyle.Secondary),
    );

    // Row 3: BLOCK · UNBLOCK · CLAIM · TRANSFER · DELETE
    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.BLOCK).setEmoji('⛔').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.UNBLOCK).setEmoji('🔓').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.CLAIM).setEmoji('👑').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.TRANSFER).setEmoji('🔁').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.DELETE).setEmoji('🗑️').setStyle(ButtonStyle.Danger),
    );

    // Row 4: LOCK · ACTIVITY · STATS · TOPIC · NOTIFY
    const row4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.LOCK).setEmoji('🔐').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.ACTIVITY).setEmoji('🎮').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.STATS).setEmoji('📊').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.TOPIC).setEmoji('📝').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TV_BUTTON_IDS.NOTIFY).setEmoji('🔔').setStyle(ButtonStyle.Secondary),
    );

    return [row1, row2, row3, row4];
  }

  buildPanelContainer(owner, channel, isLocked = false) {
    const guildName = channel.guild?.name || 'Server';
    const memberCount = channel.members?.size || 1;
    const limitText = channel.userLimit === 0 ? 'Unlimited' : `${channel.userLimit}`;
    const statusText = isLocked ? 'Locked 🔒' : 'Unlocked 🔓';

    const headerText =
      `# 50 Shop | ID\n\n` +
      `\`\`\`text\n` +
      `🔀 NAME      👥 LIMIT     🛡️ PRIVACY   ⏱️ WAIT      💬 CHAT\n` +
      `👤 TRUST     🚫 UNTRUST   📞 INVITE    👢 KICK      🌐 REGION\n` +
      `⛔ BLOCK     🔓 UNBLOCK   👑 CLAIM     🔁 TRANSFER  🗑️ DELETE\n` +
      `\`\`\`\n` +
      `### 50 Shop Tempvoice Interface\n\n` +
      `This **interface** can be used to manage your temporary voice channels in **${guildName}**. ` +
      `More options are available with **/voice** commands.\n` +
      `Type \`control panel\` or \`kontrol panel\` to bring back your voice panel.\n\n` +
      `👑 **Owner:** ${owner} | 📊 **Members:** \`${memberCount}/${limitText}\` | 🔒 **Status:** \`${statusText}\``;

    const rows = this.buildControlRows();

    // Clean Container V2 tanpa warna (clean look)
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(headerText),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true),
      )
      .addActionRowComponents(...rows)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('-# ⚙️ Use the button below to settings your voice.'),
      );

    return container;
  }

  async sendControlPanel(textChannel, state) {
    const container = this.buildPanelContainer(state.owner, state.channel, state.isLocked);
    return await textChannel.send({
      flags: [MessageFlags.IsComponentsV2],
      components: [container],
    });
  }

  async refreshPanel(state) {
    if (!state.controlPanelChannel || !state.controlPanelMessageId) return;
    try {
      const msg = await state.controlPanelChannel.messages.fetch(state.controlPanelMessageId);
      if (msg) {
        const container = this.buildPanelContainer(state.owner, state.channel, state.isLocked);
        await msg.edit({
          flags: [MessageFlags.IsComponentsV2],
          components: [container],
        });
      }
    } catch {
      // Message mungkin telah terhapus, abaikan
    }
  }

  // ── Modal Builders ────────────────────────────────────────────────────────

  async showRenameModal(interaction) {
    const modal = new ModalBuilder()
      .setCustomId(TV_MODAL_IDS.RENAME)
      .setTitle('✏️ Ubah Nama Voice Channel')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('room_name')
            .setLabel('Nama Baru Room')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('contoh: 🎧 Chill Lounge')
            .setMinLength(1)
            .setMaxLength(100)
            .setRequired(true),
        ),
      );
    await interaction.showModal(modal);
  }

  async showLimitModal(interaction) {
    const modal = new ModalBuilder()
      .setCustomId(TV_MODAL_IDS.LIMIT)
      .setTitle('👥 Atur Batas Anggota (Limit)')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('user_limit')
            .setLabel('Jumlah Maksimal Anggota (0 - 99)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('0 untuk tanpa batas (unlimited)')
            .setMinLength(1)
            .setMaxLength(2)
            .setRequired(true),
        ),
      );
    await interaction.showModal(modal);
  }

  async showUserTargetModal(interaction, modalId, title, label) {
    const modal = new ModalBuilder()
      .setCustomId(modalId)
      .setTitle(title)
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('target_user')
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ketik User ID atau @username')
            .setMinLength(2)
            .setMaxLength(100)
            .setRequired(true),
        ),
      );
    await interaction.showModal(modal);
  }

  async showTopicModal(interaction) {
    const modal = new ModalBuilder()
      .setCustomId(TV_MODAL_IDS.TOPIC)
      .setTitle('📝 Atur Topik / Status Room')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('room_topic')
            .setLabel('Topik Obrolan Saat Ini')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('contoh: Sedang mabar Valorant / Diskusi tugas')
            .setMaxLength(250)
            .setRequired(true),
        ),
      );
    await interaction.showModal(modal);
  }

  // ── Button Interaction Dispatcher ─────────────────────────────────────────

  async handleButton(interaction, state, manager) {
    const member = interaction.member;
    const isOwner = member.id === state.owner.id;

    // Tombol CLAIM bisa dipencet oleh selain owner
    if (interaction.customId === TV_BUTTON_IDS.CLAIM) {
      await this.handleClaim(interaction, state);
      return;
    }

    if (!isOwner) {
      await interaction.reply({
        content: '⛔ Hanya **Room Owner** yang dapat mengatur voice channel ini.',
        ephemeral: true,
      });
      return;
    }

    switch (interaction.customId) {
      case TV_BUTTON_IDS.NAME:
        await this.showRenameModal(interaction);
        break;

      case TV_BUTTON_IDS.LIMIT:
        await this.showLimitModal(interaction);
        break;

      case TV_BUTTON_IDS.PRIVACY:
        await this.togglePrivacy(interaction, state);
        break;

      case TV_BUTTON_IDS.WAITING_ROOM:
        await this.toggleWaitingRoom(interaction, state);
        break;

      case TV_BUTTON_IDS.CHAT:
        await this.toggleChat(interaction, state);
        break;

      case TV_BUTTON_IDS.TRUST:
        await this.showUserTargetModal(
          interaction,
          TV_MODAL_IDS.TRUST,
          '👤 Trust User',
          'User ID atau @mention untuk di-trust',
        );
        break;

      case TV_BUTTON_IDS.UNTRUST:
        await this.showUserTargetModal(
          interaction,
          TV_MODAL_IDS.UNTRUST,
          '🚫 Untrust User',
          'User ID atau @mention untuk hapus trust',
        );
        break;

      case TV_BUTTON_IDS.INVITE:
        await this.showUserTargetModal(
          interaction,
          TV_MODAL_IDS.INVITE,
          '📞 Invite User',
          'User ID atau @mention yang ingin diundang',
        );
        break;

      case TV_BUTTON_IDS.KICK:
        await this.showUserTargetModal(
          interaction,
          TV_MODAL_IDS.KICK,
          '👢 Kick User',
          'User ID atau @mention yang ingin dikeluarkan',
        );
        break;

      case TV_BUTTON_IDS.REGION:
        await this.resetRegion(interaction, state);
        break;

      case TV_BUTTON_IDS.BLOCK:
        await this.showUserTargetModal(
          interaction,
          TV_MODAL_IDS.BLOCK,
          '⛔ Block User',
          'User ID atau @mention yang ingin diblokir',
        );
        break;

      case TV_BUTTON_IDS.UNBLOCK:
        await this.showUserTargetModal(
          interaction,
          TV_MODAL_IDS.UNBLOCK,
          '🔓 Unblock User',
          'User ID atau @mention yang ingin dibuka blokirnya',
        );
        break;

      case TV_BUTTON_IDS.TRANSFER:
        await this.showUserTargetModal(
          interaction,
          TV_MODAL_IDS.TRANSFER,
          '🔁 Transfer Ownership',
          'User ID atau @mention calon owner baru',
        );
        break;

      case TV_BUTTON_IDS.DELETE:
        await this.deleteRoom(interaction, state, manager);
        break;

      case TV_BUTTON_IDS.LOCK:
        await this.toggleLock(interaction, state);
        break;

      case TV_BUTTON_IDS.ACTIVITY:
        await this.showActivity(interaction, state);
        break;

      case TV_BUTTON_IDS.STATS:
        await this.showStats(interaction, state);
        break;

      case TV_BUTTON_IDS.TOPIC:
        await this.showTopicModal(interaction);
        break;

      case TV_BUTTON_IDS.NOTIFY:
        await this.sendNotification(interaction, state);
        break;

      default:
        await interaction.reply({ content: '❓ Aksi belum tersedia.', ephemeral: true });
    }
  }

  // ── Button Actions ────────────────────────────────────────────────────────

  async toggleLock(interaction, state) {
    const isLocked = !state.isLocked;
    await state.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      Connect: isLocked ? false : null,
    });
    state.isLocked = isLocked;
    await this.refreshPanel(state);
    await interaction.reply({
      content: isLocked ? '🔒 Voice room sekarang **Terkunci** (hanya member diizinkan yang bisa masuk).' : '🔓 Voice room sekarang **Terbuka** untuk semua.',
      ephemeral: true,
    });
  }

  async togglePrivacy(interaction, state) {
    const isHidden = !state.isHidden;
    await state.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      ViewChannel: isHidden ? false : true,
    });
    state.isHidden = isHidden;
    await interaction.reply({
      content: isHidden ? '🛡️ Voice room sekarang **Tersembunyi** (Hidden).' : '🛡️ Voice room sekarang **Terlihat** untuk semua.',
      ephemeral: true,
    });
  }

  async toggleWaitingRoom(interaction, state) {
    const isWaiting = !state.isWaitingRoom;
    await state.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      ViewChannel: true,
      Connect: isWaiting ? false : null,
    });
    state.isWaitingRoom = isWaiting;
    await interaction.reply({
      content: isWaiting ? '⏱️ **Waiting Room Aktif**: Member bisa melihat room tapi harus menunggu diizinkan masuk.' : '✅ Waiting Room dinonaktifkan.',
      ephemeral: true,
    });
  }

  async toggleChat(interaction, state) {
    // Memberikan info tentang chatroom voice
    await interaction.reply({
      content: `💬 **Voice Chat**: Kamu bisa mengobrol di channel teks terintegrasi langsung dengan mengklik nama voice channel <#${state.channel.id}>!`,
      ephemeral: true,
    });
  }

  async resetRegion(interaction, state) {
    try {
      await state.channel.setRTCRegion(null);
      await interaction.reply({
        content: '🌐 RTC Region telah direset ke **Otomatis (Automatic)** untuk latensi optimal.',
        ephemeral: true,
      });
    } catch {
      await interaction.reply({ content: '❌ Gagal mengubah region.', ephemeral: true });
    }
  }

  async handleClaim(interaction, state) {
    const member = interaction.member;
    const isOwnerInRoom = state.channel.members.has(state.owner.id);

    if (isOwnerInRoom) {
      await interaction.reply({
        content: `⛔ Owner saat ini (${state.owner}) masih berada di dalam room. Kamu tidak bisa mengklaim kepemilikan.`,
        ephemeral: true,
      });
      return;
    }

    if (!state.channel.members.has(member.id)) {
      await interaction.reply({
        content: '⛔ Kamu harus berada di dalam voice room untuk mengklaim kepemilikan.',
        ephemeral: true,
      });
      return;
    }

    state.owner = member;
    await this.refreshPanel(state);
    await interaction.reply({
      content: `👑 Selamat! Kamu (${member}) sekarang adalah **Owner** dari room ini!`,
      ephemeral: false,
    });
  }

  async deleteRoom(interaction, state, manager) {
    await interaction.reply({
      content: '🗑️ Menghapus voice room...',
      ephemeral: true,
    });
    await manager.cleanupTempChannel(state.channel.id, state);
  }

  async showActivity(interaction, state) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎮 Aktivitas & Pengaturan Voice\n\n` +
          `• **Bitrate:** \`${state.channel.bitrate / 1000} kbps\`\n` +
          `• **User Limit:** \`${state.channel.userLimit === 0 ? 'Unlimited' : state.channel.userLimit}\`\n` +
          `• **RTC Region:** \`${state.channel.rtcRegion || 'Automatic'}\`\n` +
          `• **Jumlah Member:** \`${state.channel.members.size}\` orang\n\n` +
          `-# Room ID: ${state.channel.id}`,
        ),
      );

    await interaction.reply({
      flags: [MessageFlags.IsComponentsV2],
      components: [container],
      ephemeral: true,
    });
  }

  async showStats(interaction, state) {
    const uptimeMinutes = Math.floor((Date.now() - (state.createdAt || Date.now())) / 60000);
    const membersList = state.channel.members.map((m) => `• ${m.displayName}`).join('\n') || 'Tidak ada';

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📊 Statistik Voice Room\n\n` +
          `• 👑 **Owner:** ${state.owner}\n` +
          `• ⏱️ **Durasi Aktif:** \`${uptimeMinutes} menit\`\n` +
          `• 👥 **Member Saat Ini (${state.channel.members.size}):**\n${membersList}`,
        ),
      );

    await interaction.reply({
      flags: [MessageFlags.IsComponentsV2],
      components: [container],
      ephemeral: true,
    });
  }

  async sendNotification(interaction, state) {
    await interaction.reply({
      content: `🔔 ${state.owner} menyalakan notifikasi untuk semua anggota voice room!`,
    });
  }

  // ── Modal Submit Dispatcher ───────────────────────────────────────────────

  async handleModal(interaction, state) {
    const member = interaction.member;
    if (member.id !== state.owner.id) {
      await interaction.reply({ content: '⛔ Hanya owner yang bisa mengubah pengaturan.', ephemeral: true });
      return;
    }

    switch (interaction.customId) {
      case TV_MODAL_IDS.RENAME: {
        const newName = interaction.fields.getTextInputValue('room_name').trim();
        await state.channel.setName(newName);
        await this.refreshPanel(state);
        await interaction.reply({ content: `✅ Nama room berhasil diubah menjadi: **${newName}**`, ephemeral: true });
        break;
      }

      case TV_MODAL_IDS.LIMIT: {
        const rawLimit = interaction.fields.getTextInputValue('user_limit').trim();
        const limit = parseInt(rawLimit, 10);
        if (isNaN(limit) || limit < 0 || limit > 99) {
          await interaction.reply({ content: '❌ Limit harus berupa angka antara 0 dan 99.', ephemeral: true });
          return;
        }
        await state.channel.setUserLimit(limit);
        await this.refreshPanel(state);
        await interaction.reply({
          content: `✅ Limit room diatur ke: **${limit === 0 ? 'Unlimited' : limit} member**`,
          ephemeral: true,
        });
        break;
      }

      case TV_MODAL_IDS.TRUST: {
        const targetInput = interaction.fields.getTextInputValue('target_user').trim();
        const targetMember = await this.resolveMember(interaction.guild, targetInput);
        if (!targetMember) {
          await interaction.reply({ content: '❌ User tidak ditemukan.', ephemeral: true });
          return;
        }
        await state.channel.permissionOverwrites.edit(targetMember, {
          Connect: true,
          ViewChannel: true,
        });
        await interaction.reply({ content: `✅ ${targetMember} sekarang di-trust dan dapat bergabung ke room kapan saja.`, ephemeral: true });
        break;
      }

      case TV_MODAL_IDS.UNTRUST: {
        const targetInput = interaction.fields.getTextInputValue('target_user').trim();
        const targetMember = await this.resolveMember(interaction.guild, targetInput);
        if (!targetMember) {
          await interaction.reply({ content: '❌ User tidak ditemukan.', ephemeral: true });
          return;
        }
        await state.channel.permissionOverwrites.delete(targetMember);
        await interaction.reply({ content: `✅ Trust untuk ${targetMember} telah dicabut.`, ephemeral: true });
        break;
      }

      case TV_MODAL_IDS.INVITE: {
        const targetInput = interaction.fields.getTextInputValue('target_user').trim();
        const targetMember = await this.resolveMember(interaction.guild, targetInput);
        if (!targetMember) {
          await interaction.reply({ content: '❌ User tidak ditemukan.', ephemeral: true });
          return;
        }
        await state.channel.permissionOverwrites.edit(targetMember, {
          Connect: true,
          ViewChannel: true,
        });
        try {
          await targetMember.send(`📨 Kamu diundang oleh ${state.owner} untuk bergabung ke voice channel: <#${state.channel.id}>!`);
        } catch {
          // Gagal DM bukan fatal
        }
        await interaction.reply({ content: `✅ Undangan berhasil dikirim ke ${targetMember}.`, ephemeral: true });
        break;
      }

      case TV_MODAL_IDS.KICK: {
        const targetInput = interaction.fields.getTextInputValue('target_user').trim();
        const targetMember = await this.resolveMember(interaction.guild, targetInput);
        if (!targetMember) {
          await interaction.reply({ content: '❌ User tidak ditemukan.', ephemeral: true });
          return;
        }
        if (targetMember.voice?.channelId === state.channel.id) {
          await targetMember.voice.disconnect('Dikeluarkan oleh owner temp voice.');
        }
        await state.channel.permissionOverwrites.edit(targetMember, { Connect: false });
        await interaction.reply({ content: `👢 ${targetMember} telah dikeluarkan dari voice room.`, ephemeral: true });
        break;
      }

      case TV_MODAL_IDS.BLOCK: {
        const targetInput = interaction.fields.getTextInputValue('target_user').trim();
        const targetMember = await this.resolveMember(interaction.guild, targetInput);
        if (!targetMember) {
          await interaction.reply({ content: '❌ User tidak ditemukan.', ephemeral: true });
          return;
        }
        if (targetMember.voice?.channelId === state.channel.id) {
          await targetMember.voice.disconnect('Diblokir dari temp voice.');
        }
        await state.channel.permissionOverwrites.edit(targetMember, {
          Connect: false,
          ViewChannel: false,
        });
        await interaction.reply({ content: `⛔ ${targetMember} telah diblokir dari room ini.`, ephemeral: true });
        break;
      }

      case TV_MODAL_IDS.UNBLOCK: {
        const targetInput = interaction.fields.getTextInputValue('target_user').trim();
        const targetMember = await this.resolveMember(interaction.guild, targetInput);
        if (!targetMember) {
          await interaction.reply({ content: '❌ User tidak ditemukan.', ephemeral: true });
          return;
        }
        await state.channel.permissionOverwrites.delete(targetMember);
        await interaction.reply({ content: `🔓 Blokir terhadap ${targetMember} telah dibuka.`, ephemeral: true });
        break;
      }

      case TV_MODAL_IDS.TRANSFER: {
        const targetInput = interaction.fields.getTextInputValue('target_user').trim();
        const targetMember = await this.resolveMember(interaction.guild, targetInput);
        if (!targetMember) {
          await interaction.reply({ content: '❌ User tidak ditemukan.', ephemeral: true });
          return;
        }
        state.owner = targetMember;
        await this.refreshPanel(state);
        await interaction.reply({ content: `👑 Kepemilikan room berhasil dialihkan ke ${targetMember}!`, ephemeral: false });
        break;
      }

      case TV_MODAL_IDS.TOPIC: {
        const topic = interaction.fields.getTextInputValue('room_topic').trim();
        await interaction.reply({
          content: `📝 **Topik Room Diperbarui:**\n> ${topic}`,
          ephemeral: false,
        });
        break;
      }
    }
  }

  async resolveMember(guild, input) {
    const cleanId = input.replace(/[<@!>]/g, '').trim();
    try {
      return await guild.members.fetch(cleanId);
    } catch {
      // Coba cari by username jika bukan ID
      const found = guild.members.cache.find(
        (m) =>
          m.user.username.toLowerCase() === input.toLowerCase() ||
          m.displayName.toLowerCase() === input.toLowerCase(),
      );
      return found ?? null;
    }
  }
}
