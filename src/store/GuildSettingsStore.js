import fs from 'fs';
import path from 'path';

/** Default schema for each guild */
export const DEFAULT_GUILD_SETTINGS = {
  welcome: {
    enabled: true,
    channelId: '',
    title: '👋 Welcome to {server}!',
    description: 'Hey {user}, welcome aboard! You are member **#{count}**.\nEnjoy your stay and read the rules.',
    color: '#5865F2',
    imageUrl: '',
    footer: 'User ID: {userId}',
  },
  goodbye: {
    enabled: true,
    channelId: '',
    title: '👋 Goodbye from {server}',
    description: '**{user}** has left the server. We now have **#{count}** members.',
    color: '#ED4245',
    imageUrl: '',
    footer: 'They will be missed.',
  },
  boost: {
    enabled: true,
    channelId: '',
    theme: 'dark', // 'dark' (Gambar 2) | 'light' (Gambar 3)
    titleHeader: '11DKK',
    subtitle: 'THANKS BOOSTER SERVER',
    backgroundImageUrl: '',
    unboostNotify: true,
  },
  tempvoice: {
    enabled: true,
    hubChannelId: '',
    categoryId: '',
    voicePanelChannelId: '',
    channelNameTemplate: "🎙️ {username}'s Room",
    defaultLimit: 0,
  },
};

/**
 * GuildSettingsStore — membaca dan menulis pengaturan guild ke file JSON.
 * Termasuk migrasi otomatis dari format lama.
 */
export class GuildSettingsStore {
  constructor(filePath = path.resolve(process.cwd(), 'data', 'guild-settings.json')) {
    this.filePath = filePath;
    this.cache = {};
    this.loaded = false;
  }

  publicInit() {
    this.ensureLoaded();
  }

  get(guildId) {
    this.ensureLoaded();
    if (!this.cache[guildId]) {
      this.cache[guildId] = JSON.parse(JSON.stringify(DEFAULT_GUILD_SETTINGS));
      this.persist();
    }
    return this.cache[guildId];
  }

  set(guildId, partial) {
    this.ensureLoaded();
    const current = this.get(guildId);
    this.cache[guildId] = this.deepMerge(current, partial);
    this.persist();
    return this.cache[guildId];
  }

  deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (
        source[key] !== null &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target[key] !== null &&
        typeof target[key] === 'object'
      ) {
        result[key] = this.deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  ensureLoaded() {
    if (this.loaded) return;
    this.loaded = true;

    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        // Migrasi format lama jika perlu
        for (const [gid, val] of Object.entries(parsed)) {
          this.cache[gid] = this.migrateLegacySettings(val);
        }
      }
    } catch (error) {
      console.error('[GuildSettingsStore] Gagal membaca settings file:', error);
      this.cache = {};
    }
  }

  migrateLegacySettings(val) {
    const template = JSON.parse(JSON.stringify(DEFAULT_GUILD_SETTINGS));
    if (!val) return template;

    // Jika format lama dengan flat properties
    if ('welcomeChannelId' in val || 'boostChannelId' in val || 'hubChannelId' in val) {
      if (val.welcomeChannelId) template.welcome.channelId = val.welcomeChannelId;
      if (val.goodbyeChannelId) template.goodbye.channelId = val.goodbyeChannelId;
      if (val.boostChannelId) template.boost.channelId = val.boostChannelId;
      if (val.hubChannelId) template.tempvoice.hubChannelId = val.hubChannelId;
      if (val.tempVoiceCategoryId) template.tempvoice.categoryId = val.tempVoiceCategoryId;
      if (val.voicePanelChannelId) template.tempvoice.voicePanelChannelId = val.voicePanelChannelId;
      return template;
    }

    return this.deepMerge(template, val);
  }

  persist() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.cache, null, 2), 'utf-8');
    } catch (error) {
      console.error('[GuildSettingsStore] Gagal menyimpan settings file:', error);
    }
  }
}
