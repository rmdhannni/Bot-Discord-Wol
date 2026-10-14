import { Collection, REST, Routes, MessageFlags } from 'discord.js';
import { CFG_IDS } from '../modules/setup/SetupDashboard.js';

/**
 * CommandHandler — Menangani pendaftaran slash command dan dispatch interaksi.
 */
export class CommandHandler {
  constructor(client, commands, clientId, setupDashboard) {
    this.client = client;
    this.clientId = clientId;
    this.commands = new Collection(commands.map((cmd) => [cmd.data.name, cmd]));
    this.setupDashboard = setupDashboard;
  }

  register() {
    this.client.once('clientReady', () => this.deployCommands());

    this.client.on('interactionCreate', (interaction) =>
      this.onInteractionCreate(interaction),
    );
  }

  async onInteractionCreate(interaction) {
    // 1. Tangani Chat Input Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = this.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        if (error.code === 10062 || error.code === 40060) return;
        console.error(`[CommandHandler] Error /${interaction.commandName}:`, error);
        const reply = {
          content: '❌ Terjadi kesalahan saat menjalankan perintah.',
          flags: MessageFlags.Ephemeral,
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply).catch(() => {});
        } else {
          await interaction.reply(reply).catch(() => {});
        }
      }
      return;
    }

    // 2. Tangani Interaksi Setup Dashboard (Buttons, Select Menus, Modals)
    const isCfgInteraction =
      Boolean(interaction.customId && interaction.customId.startsWith('cfg_'));

    if (isCfgInteraction && this.setupDashboard) {
      try {
        await this.setupDashboard.handleInteraction(interaction);
      } catch (error) {
        if (error.code === 10062 || error.code === 40060) return;
        console.error('[CommandHandler] Error handling setup dashboard interaction:', error);
      }
    }
  }

  async deployCommands() {
    const token = process.env.BOT_TOKEN;
    if (!token) {
      console.error('[CommandHandler] BOT_TOKEN tidak ada, skip deploy.');
      return;
    }

    const body = this.commands.map((cmd) => cmd.data.toJSON());
    const rest = new REST().setToken(token);

    try {
      console.log(`[CommandHandler] Mendaftarkan ${body.length} slash commands...`);
      await rest.put(Routes.applicationCommands(this.clientId), { body });
      console.log('[CommandHandler] ✅ Slash commands berhasil didaftarkan ke Discord API (Global).');

      // Daftarkan langsung ke seluruh guild agar update instan (tanpa delay cache 1 jam)
      for (const guild of this.client.guilds.cache.values()) {
        try {
          await rest.put(Routes.applicationGuildCommands(this.clientId, guild.id), { body });
          console.log(`[CommandHandler] ⚡ Slash commands terupdate instan di server: ${guild.name} (${guild.id})`);
        } catch (guildErr) {
          console.warn(`[CommandHandler] Gagal update instan di server ${guild.id}:`, guildErr.message);
        }
      }
    } catch (error) {
      console.error('[CommandHandler] ❌ Gagal mendaftarkan slash commands:', error);
    }
  }
}
