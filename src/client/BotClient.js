import { Client, GatewayIntentBits, Partials } from 'discord.js';

/**
 * BotClient — Wrapper utama client Discord.
 */
export class BotClient {
  constructor(serviceFactory) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [
        Partials.GuildMember,
        Partials.User,
        Partials.Channel,
        Partials.Message,
      ],
    });

    this.serviceFactory = serviceFactory;
  }

  getClient() {
    return this.client;
  }

  async login(token) {
    const services = this.serviceFactory(this.client);
    for (const service of services) {
      if (typeof service.register === 'function') {
        service.register();
      }
    }

    this.client.once('clientReady', (c) => {
      console.log(`✅ Logged in sebagai: ${c.user.tag}`);
    });

    await this.client.login(token);
  }
}
