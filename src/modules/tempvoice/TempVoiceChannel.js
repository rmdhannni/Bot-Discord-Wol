import { ChannelType, PermissionFlagsBits } from 'discord.js';

/**
 * TempVoiceChannel — membuat dan menghapus voice channel sementara.
 */
export class TempVoiceChannel {
  /**
   * Membuat voice channel baru dan memindahkan owner ke dalamnya.
   */
  async createTempChannel(owner, categoryId, nameTemplate = "🎙️ {username}'s Room", defaultLimit = 0) {
    const channelName = (nameTemplate || "🎙️ {username}'s Room").replace(
      '{username}',
      owner.user.username,
    );

    let parentCategory = null;
    if (categoryId) {
      try {
        const cat = await owner.guild.channels.fetch(categoryId);
        if (cat?.type === ChannelType.GuildCategory) {
          parentCategory = cat;
        }
      } catch {
        // Abaikan jika category tidak valid
      }
    }

    const voiceChannel = await owner.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildVoice,
      parent: parentCategory ?? undefined,
      userLimit: typeof defaultLimit === 'number' ? defaultLimit : 0,
      permissionOverwrites: [
        {
          id: owner.guild.roles.everyone.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
        },
        {
          id: owner.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.MoveMembers,
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.DeafenMembers,
          ],
        },
      ],
    });

    // Pindahkan owner ke voice channel yang baru dibuat
    try {
      if (owner.voice.channelId) {
        await owner.voice.setChannel(voiceChannel);
      }
    } catch (err) {
      console.warn('[TempVoiceChannel] Gagal memindahkan owner ke room:', err);
    }

    return {
      channel: voiceChannel,
      owner,
      isLocked: false,
      isWaitingRoom: false,
      isHidden: false,
      createdAt: Date.now(),
    };
  }

  /**
   * Menghapus voice channel dari server Discord.
   */
  async deleteTempChannel(channel) {
    try {
      if (channel && channel.deletable) {
        await channel.delete('Temporary Voice Channel kosong/dihapus.');
      }
    } catch (error) {
      console.error(`[TempVoiceChannel] Gagal menghapus voice channel ${channel?.id}:`, error);
    }
  }
}
