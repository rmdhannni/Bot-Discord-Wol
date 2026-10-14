import { MessageFlags } from 'discord.js';
import { WelcomeEmbedBuilder } from './WelcomeEmbedBuilder.js';

/**
 * WelcomeService — menangani event `guildMemberAdd` dan `guildMemberRemove`.
 * Mengambil preferensi guild secara real-time dari GuildSettingsStore.
 * Mengirim pesan menggunakan Container V2 (clean look, tanpa warna).
 */
export class WelcomeService {
  constructor(client, store) {
    this.client = client;
    this.store = store;
    this.embedBuilder = new WelcomeEmbedBuilder();
  }

  register() {
    this.client.on('guildMemberAdd', (member) => this.onMemberAdd(member));
    this.client.on('guildMemberRemove', (member) => this.onMemberRemove(member));
  }

  async onMemberAdd(member) {
    if (!member.guild) return;
    try {
      const settings = this.store.get(member.guild.id);
      if (!settings?.welcome?.enabled) return;

      const channelId = settings.welcome.channelId;
      if (!channelId) return;

      const channel = await this.resolveTextChannel(channelId);
      if (!channel) return;

      const container = this.embedBuilder.buildWelcomeContainer(member, settings.welcome);
      await channel.send({
        flags: [MessageFlags.IsComponentsV2],
        components: [container],
      });
    } catch (error) {
      console.error('[WelcomeService] Gagal mengirim pesan welcome:', error);
    }
  }

  async onMemberRemove(member) {
    if (!member.guild) return;
    try {
      const settings = this.store.get(member.guild.id);
      if (!settings?.goodbye?.enabled) return;

      const channelId = settings.goodbye.channelId;
      if (!channelId) return;

      const channel = await this.resolveTextChannel(channelId);
      if (!channel) return;

      const container = this.embedBuilder.buildGoodbyeContainer(member, settings.goodbye);
      await channel.send({
        flags: [MessageFlags.IsComponentsV2],
        components: [container],
      });
    } catch (error) {
      console.error('[WelcomeService] Gagal mengirim pesan goodbye:', error);
    }
  }

  async resolveTextChannel(channelId) {
    if (!channelId) return null;
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) return null;
      return channel;
    } catch {
      return null;
    }
  }
}
