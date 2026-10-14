import { SlashCommandBuilder } from 'discord.js';

/**
 * VoiceCommand — Perintah `/voice` untuk memunculkan kembali
 * panel kontrol temp voice ke channel obrolan pengguna.
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
        ephemeral: true,
      });
      return;
    }

    const state = this.manager.getStateByOwner(interaction.user.id);
    if (!state) {
      await interaction.reply({
        content: '❌ Kamu tidak memiliki room voice aktif saat ini. Masuk ke channel **Join to Create** untuk membuat room.',
        ephemeral: true,
      });
      return;
    }

    await this.manager.sendPanelToChannel(interaction.channel, state);

    await interaction.reply({
      content: '✅ Panel kontrol room kamu telah dikirim ke channel ini!',
      ephemeral: true,
    });
  }
}
