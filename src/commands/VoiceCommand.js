import { SlashCommandBuilder, MessageFlags } from 'discord.js';

/**
 * VoiceCommand — Perintah `/voice` untuk memunculkan kembali
 * panel kontrol temp voice ke text chat dalam voice channel milik user.
 */
export class VoiceCommand {
  constructor(manager) {
    this.manager = manager;

    this.data = new SlashCommandBuilder()
      .setName('voice')
      .setDescription('🎙️ Munculkan panel kontrol voice room milikmu.');
  }

  async execute(interaction) {
    if (!interaction.guildId || !interaction.guild) {
      await interaction.reply({
        content: '❌ Perintah ini hanya bisa digunakan di dalam server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const state = this.manager.getStateByOwner(interaction.user.id);
    if (!state) {
      await interaction.reply({
        content: '❌ Kamu tidak memiliki room voice aktif saat ini. Masuk ke channel **Join to Create** untuk membuat room.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Kirim panel ke text chat dalam voice channel milik user (bukan channel tempat ketik)
    const voiceTextChannel = state.channel.isTextBased ? state.channel : interaction.channel;
    await this.manager.sendPanelToChannel(voiceTextChannel, state);

    await interaction.reply({
      content: `✅ Panel kontrol room kamu telah dikirim ke <#${voiceTextChannel.id}>!`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
