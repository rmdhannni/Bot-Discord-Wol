import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';

/**
 * SetupCommand — Perintah tunggal `/setup` untuk membuka
 * Panel Konfigurasi Interaktif dengan 3 pilihan menu & modal pop-up kustom.
 */
export class SetupCommand {
  constructor(store, dashboard) {
    this.store = store;
    this.dashboard = dashboard;

    this.data = new SlashCommandBuilder()
      .setName('setup')
      .setDescription('⚙️ Buka panel konfigurasi interaktif bot (Welcome, Booster, Temp Voice).')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
  }

  async execute(interaction) {
    if (!interaction.guildId || !interaction.guild) {
      await interaction.reply({
        content: '❌ Perintah ini hanya bisa digunakan di dalam server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const dashboardPayload = this.dashboard.buildMainDashboard(
      interaction.guildId,
      interaction.guild.name,
    );

    await interaction.reply({
      ...dashboardPayload,
      flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
    });
  }
}
