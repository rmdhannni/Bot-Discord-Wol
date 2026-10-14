import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
} from 'discord.js';

export const CFG_IDS = {
  // Main
  MAIN_SELECT: 'cfg_main_select',
  MENU_WELCOME: 'cfg_btn_welcome',
  MENU_BOOST: 'cfg_btn_boost',
  MENU_TV: 'cfg_btn_tempvoice',
  REFRESH: 'cfg_btn_refresh',
  BACK_MAIN: 'cfg_btn_back',

  // Welcome / Goodbye
  TOGGLE_WELCOME: 'cfg_toggle_welcome',
  TOGGLE_GOODBYE: 'cfg_toggle_goodbye',
  MODAL_WELCOME: 'cfg_modal_welcome',
  MODAL_GOODBYE: 'cfg_modal_goodbye',
  TEST_WELCOME: 'cfg_test_welcome',
  TEST_GOODBYE: 'cfg_test_goodbye',
  SELECT_WELCOME_CH: 'cfg_sel_welcome_ch',
  SELECT_GOODBYE_CH: 'cfg_sel_goodbye_ch',

  // Boost
  TOGGLE_BOOST: 'cfg_toggle_boost',
  TOGGLE_THEME: 'cfg_toggle_theme',
  TOGGLE_UNBOOST: 'cfg_toggle_unboost',
  MODAL_BOOST: 'cfg_modal_boost',
  TEST_BOOST: 'cfg_test_boost',
  TEST_UNBOOST: 'cfg_test_unboost',
  SELECT_BOOST_CH: 'cfg_sel_boost_ch',

  // Temp Voice
  TOGGLE_TV: 'cfg_toggle_tv',
  MODAL_TV: 'cfg_modal_tv',
  SEND_TV_PANEL: 'cfg_send_panel',
  SELECT_TV_HUB: 'cfg_sel_tv_hub',
  SELECT_TV_CAT: 'cfg_sel_tv_cat',
  SELECT_TV_PANEL: 'cfg_sel_tv_panel',

  // Modal IDs
  SUBMIT_WELCOME_MODAL: 'cfg_sub_welcome_modal',
  SUBMIT_GOODBYE_MODAL: 'cfg_sub_goodbye_modal',
  SUBMIT_BOOST_MODAL: 'cfg_sub_boost_modal',
  SUBMIT_TV_MODAL: 'cfg_sub_tv_modal',
};

/**
 * SetupDashboard — Interactive Chat Configuration Panel (klik-klik langsung).
 */
export class SetupDashboard {
  constructor(store, boostGenerator, welcomeBuilder, tvManager) {
    this.store = store;
    this.boostGenerator = boostGenerator;
    this.welcomeBuilder = welcomeBuilder;
    this.tvManager = tvManager;
  }

  // ── Main Dashboard ────────────────────────────────────────────────────────

  // ── Main Dashboard ────────────────────────────────────────────────────────

  buildMainDashboard(guildId, guildName) {
    const s = this.store.get(guildId);

    const fmtCh = (id) => (id ? `<#${id}>` : '`Belum diatur`');
    const badge = (v) => (v ? '🟢 **Aktif**' : '🔴 **Nonaktif**');

    const content =
      `# ⚙️ Panel Konfigurasi — ${guildName}\n\n` +
      `Selamat datang di pusat pengaturan bot! Kamu dapat mengonfigurasi semua fitur cukup dengan memilih dropdown atau mengklik tombol di bawah ini.\n\n` +
      `### 👋 Welcome & Goodbye\n` +
      `• Status Welcome: ${badge(s.welcome.enabled)} (${fmtCh(s.welcome.channelId)})\n` +
      `• Status Goodbye: ${badge(s.goodbye.enabled)} (${fmtCh(s.goodbye.channelId)})\n\n` +
      `### 💖 Server Booster\n` +
      `• Status: ${badge(s.boost.enabled)} (${fmtCh(s.boost.channelId)})\n` +
      `• Tema: \`${s.boost.theme.toUpperCase()}\` • Tag: \`${s.boost.titleHeader}\`\n\n` +
      `### 🎙️ Temporary Voice\n` +
      `• Status: ${badge(s.tempvoice.enabled)}\n` +
      `• Hub Voice: ${fmtCh(s.tempvoice.hubChannelId)}\n` +
      `• Kategori: ${fmtCh(s.tempvoice.categoryId)}\n` +
      `• Voice Panel: ${fmtCh(s.tempvoice.voicePanelChannelId)}`;

    // 1. Dropdown 3 Pilihan Menu Utama
    const menuRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(CFG_IDS.MAIN_SELECT)
        .setPlaceholder('👉 Pilih salah satu dari 3 fitur untuk diatur...')
        .addOptions([
          {
            label: 'Welcome & Goodbye',
            value: 'opt_welcome',
            description: 'Atur pesan welcome, goodbye, pop-up modal & channel',
            emoji: '👋',
          },
          {
            label: 'Server Booster',
            value: 'opt_boost',
            description: 'Atur notifikasi booster, kartu banner Dark/Light & unboost',
            emoji: '💖',
          },
          {
            label: 'Temporary Voice',
            value: 'opt_tempvoice',
            description: 'Atur Join-to-Create, hub voice, kategori & panel kontrol',
            emoji: '🎙️',
          },
        ]),
    );

    // 2. Tombol Navigasi 3 Pilihan
    const btnRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(CFG_IDS.MENU_WELCOME)
        .setLabel('Welcome & Goodbye')
        .setEmoji('👋')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.MENU_BOOST)
        .setLabel('Server Booster')
        .setEmoji('💖')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.MENU_TV)
        .setLabel('Temporary Voice')
        .setEmoji('🎙️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.REFRESH)
        .setLabel('Refresh')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Secondary),
    );

    // Clean Container V2 tanpa warna (clean look)
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true),
      )
      .addActionRowComponents(menuRow, btnRow)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('-# Pilih salah satu dari 3 opsi fitur di dropdown atau tombol di atas.'),
      );

    return {
      flags: [MessageFlags.IsComponentsV2],
      components: [container],
      embeds: [],
    };
  }

  // ── Welcome & Goodbye Submenu ─────────────────────────────────────────────

  buildWelcomeDashboard(guildId) {
    const s = this.store.get(guildId);
    const fmtCh = (id) => (id ? `<#${id}>` : '`Belum diatur`');

    const content =
      `# 👋 Pengaturan Welcome & Goodbye\n\n` +
      `Atur pesan selamat datang dan perpisahan. Kamu bisa menyesuaikan kata-kata, warna, dan link gambar melalui pop-up interaktif.\n\n` +
      `### 🌟 Welcome Settings\n` +
      `• Status: ${s.welcome.enabled ? '🟢 **Aktif**' : '🔴 **Nonaktif**'}\n` +
      `• Channel: ${fmtCh(s.welcome.channelId)}\n` +
      `• Judul: \`${s.welcome.title}\`\n\n` +
      `### 👋 Goodbye Settings\n` +
      `• Status: ${s.goodbye.enabled ? '🟢 **Aktif**' : '🔴 **Nonaktif**'}\n` +
      `• Channel: ${fmtCh(s.goodbye.channelId)}\n` +
      `• Judul: \`${s.goodbye.title}\``;

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(CFG_IDS.TOGGLE_WELCOME)
        .setLabel(s.welcome.enabled ? 'Nonaktifkan Welcome' : 'Aktifkan Welcome')
        .setStyle(s.welcome.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.MODAL_WELCOME)
        .setLabel('Edit Welcome Pop-up')
        .setEmoji('✏️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.TEST_WELCOME)
        .setLabel('Preview Welcome')
        .setEmoji('👁️')
        .setStyle(ButtonStyle.Secondary),
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(CFG_IDS.TOGGLE_GOODBYE)
        .setLabel(s.goodbye.enabled ? 'Nonaktifkan Goodbye' : 'Aktifkan Goodbye')
        .setStyle(s.goodbye.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.MODAL_GOODBYE)
        .setLabel('Edit Goodbye Pop-up')
        .setEmoji('✏️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.TEST_GOODBYE)
        .setLabel('Preview Goodbye')
        .setEmoji('👁️')
        .setStyle(ButtonStyle.Secondary),
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(CFG_IDS.SELECT_WELCOME_CH)
        .setPlaceholder('Pilih Channel Teks Welcome')
        .setChannelTypes(ChannelType.GuildText),
    );

    const row4 = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(CFG_IDS.SELECT_GOODBYE_CH)
        .setPlaceholder('Pilih Channel Teks Goodbye')
        .setChannelTypes(ChannelType.GuildText),
    );

    const row5 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(CFG_IDS.BACK_MAIN)
        .setLabel('Kembali ke Menu Utama')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary),
    );

    // Clean Container V2 tanpa warna (clean look)
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true),
      )
      .addActionRowComponents(row1, row2, row3, row4, row5);

    return {
      flags: [MessageFlags.IsComponentsV2],
      components: [container],
      embeds: [],
    };
  }

  // ── Booster Submenu ───────────────────────────────────────────────────────

  buildBoostDashboard(guildId) {
    const s = this.store.get(guildId);
    const fmtCh = (id) => (id ? `<#${id}>` : '`Belum diatur`');

    const content =
      `# 💖 Pengaturan Server Booster\n\n` +
      `Fitur kartu booster otomatis (Gambar 2 & 3). Saat member me-boost server, bot akan mengirim gambar banner canvas dengan progress bar. Saat boost habis, bot akan mengirim notifikasi.\n\n` +
      `### 📊 Pengaturan Kartu Booster\n` +
      `• Status: ${s.boost.enabled ? '🟢 **Aktif**' : '🔴 **Nonaktif**'}\n` +
      `• Channel Notif: ${fmtCh(s.boost.channelId)}\n` +
      `• Tema Tampilan: **${s.boost.theme.toUpperCase()}** (${s.boost.theme === 'dark' ? 'Dark Grunge - Gbr 2' : 'White Splatter - Gbr 3'})\n` +
      `• Tag Header: \`Otomatis (Username Booster)\`\n` +
      `• Subtitle: \`${s.boost.subtitle}\`\n` +
      `• Notif Unboost: ${s.boost.unboostNotify ? '🟢 Aktif' : '🔴 Nonaktif'}`;

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(CFG_IDS.TOGGLE_BOOST)
        .setLabel(s.boost.enabled ? 'Nonaktifkan Booster' : 'Aktifkan Booster')
        .setStyle(s.boost.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.TOGGLE_THEME)
        .setLabel(`Ganti Tema: ${s.boost.theme === 'dark' ? 'Light' : 'Dark'}`)
        .setEmoji('🎨')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.MODAL_BOOST)
        .setLabel('Edit Teks Pop-up')
        .setEmoji('✏️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.TOGGLE_UNBOOST)
        .setLabel(s.boost.unboostNotify ? 'Matikan Notif Unboost' : 'Nyalakan Notif Unboost')
        .setStyle(ButtonStyle.Secondary),
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(CFG_IDS.TEST_BOOST)
        .setLabel('Test Gambar Booster')
        .setEmoji('👁️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.TEST_UNBOOST)
        .setLabel('Test Notif Unboost')
        .setEmoji('💔')
        .setStyle(ButtonStyle.Secondary),
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(CFG_IDS.SELECT_BOOST_CH)
        .setPlaceholder('Pilih Channel Notifikasi Booster')
        .setChannelTypes(ChannelType.GuildText),
    );

    const row4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(CFG_IDS.BACK_MAIN)
        .setLabel('Kembali ke Menu Utama')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary),
    );

    // Clean Container V2 tanpa warna (clean look)
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true),
      )
      .addActionRowComponents(row1, row2, row3, row4);

    return {
      flags: [MessageFlags.IsComponentsV2],
      components: [container],
      embeds: [],
    };
  }

  // ── Temp Voice Submenu ────────────────────────────────────────────────────

  buildTempVoiceDashboard(guildId) {
    const s = this.store.get(guildId);
    const fmtCh = (id) => (id ? `<#${id}>` : '`Belum diatur`');
    const activeRooms = this.tvManager ? this.tvManager.getActiveRoomsCount(guildId) : 0;
    const maxRoomsText = (s.tempvoice.maxRooms && s.tempvoice.maxRooms > 0)
      ? `${s.tempvoice.maxRooms} room`
      : 'Unlimited (Tanpa Batas)';

    const content =
      `# 🎙️ Pengaturan Temporary Voice\n\n` +
      `Sistem Join-to-Create room otomatis dengan antarmuka panel kontrol lengkap (Gambar 1).\n\n` +
      `### ⚙️ Konfigurasi Saat Ini\n` +
      `• Status: ${s.tempvoice.enabled ? '🟢 **Aktif**' : '🔴 **Nonaktif**'}\n` +
      `• Hub Voice (Join to Create): ${fmtCh(s.tempvoice.hubChannelId)}\n` +
      `• Kategori Room: ${fmtCh(s.tempvoice.categoryId)}\n` +
      `• Text Channel Panel: ${fmtCh(s.tempvoice.voicePanelChannelId)}\n` +
      `• Template Nama Room: \`${s.tempvoice.channelNameTemplate}\`\n` +
      `• Default Member Limit (per room): \`${s.tempvoice.defaultLimit === 0 ? 'Unlimited' : s.tempvoice.defaultLimit}\`\n` +
      `• Kuota Maksimal Room Server: \`${maxRoomsText}\`\n\n` +
      `### 📊 Status Realtime\n` +
      `• Room Terbuat Saat Ini: **${activeRooms}** / ${s.tempvoice.maxRooms > 0 ? s.tempvoice.maxRooms : '∞'} room aktif\n` +
      `*(Jumlah room otomatis update realtime mengikuti room yang sedang aktif)*`;

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(CFG_IDS.TOGGLE_TV)
        .setLabel(s.tempvoice.enabled ? 'Nonaktifkan Temp Voice' : 'Aktifkan Temp Voice')
        .setStyle(s.tempvoice.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.MODAL_TV)
        .setLabel('Edit Nama & Limit Pop-up')
        .setEmoji('✏️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.SEND_TV_PANEL)
        .setLabel('Kirim Panel Sekarang')
        .setEmoji('🚀')
        .setStyle(ButtonStyle.Success),
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(CFG_IDS.SELECT_TV_HUB)
        .setPlaceholder('Pilih Hub Voice Channel (Join to Create)')
        .setChannelTypes(ChannelType.GuildVoice),
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(CFG_IDS.SELECT_TV_CAT)
        .setPlaceholder('Pilih Kategori Temp Voice')
        .setChannelTypes(ChannelType.GuildCategory),
    );

    const row4 = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(CFG_IDS.SELECT_TV_PANEL)
        .setPlaceholder('Pilih Text Channel Tempat Panel Dikirim')
        .setChannelTypes(ChannelType.GuildText),
    );

    const row5 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(CFG_IDS.BACK_MAIN)
        .setLabel('Kembali ke Menu Utama')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary),
    );

    // Clean Container V2 tanpa warna (clean look)
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true),
      )
      .addActionRowComponents(row1, row2, row3, row4, row5);

    return {
      flags: [MessageFlags.IsComponentsV2],
      components: [container],
      embeds: [],
    };
  }

  // ── Modals Opener ─────────────────────────────────────────────────────────

  async showWelcomeModal(interaction) {
    const s = this.store.get(interaction.guildId);
    const modal = new ModalBuilder()
      .setCustomId(CFG_IDS.SUBMIT_WELCOME_MODAL)
      .setTitle('✏️ Edit Pesan Welcome')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('w_title')
            .setLabel('Judul Embed')
            .setValue(s.welcome.title)
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('w_desc')
            .setLabel('Deskripsi ({user}, {server}, {count})')
            .setValue(s.welcome.description)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('w_color')
            .setLabel('Warna Hex (e.g. #5865F2)')
            .setValue(s.welcome.color)
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('w_image')
            .setLabel('Banner Image URL (Opsional)')
            .setValue(s.welcome.imageUrl || '')
            .setStyle(TextInputStyle.Short)
            .setRequired(false),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('w_footer')
            .setLabel('Footer Text')
            .setValue(s.welcome.footer)
            .setStyle(TextInputStyle.Short)
            .setRequired(false),
        ),
      );
    await interaction.showModal(modal);
  }

  async showGoodbyeModal(interaction) {
    const s = this.store.get(interaction.guildId);
    const modal = new ModalBuilder()
      .setCustomId(CFG_IDS.SUBMIT_GOODBYE_MODAL)
      .setTitle('✏️ Edit Pesan Goodbye')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('g_title')
            .setLabel('Judul Embed')
            .setValue(s.goodbye.title)
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('g_desc')
            .setLabel('Deskripsi ({user}, {server}, {count})')
            .setValue(s.goodbye.description)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('g_color')
            .setLabel('Warna Hex (e.g. #ED4245)')
            .setValue(s.goodbye.color)
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('g_image')
            .setLabel('Banner Image URL (Opsional)')
            .setValue(s.goodbye.imageUrl || '')
            .setStyle(TextInputStyle.Short)
            .setRequired(false),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('g_footer')
            .setLabel('Footer Text')
            .setValue(s.goodbye.footer)
            .setStyle(TextInputStyle.Short)
            .setRequired(false),
        ),
      );
    await interaction.showModal(modal);
  }

  async showBoostModal(interaction) {
    const s = this.store.get(interaction.guildId);
    const modal = new ModalBuilder()
      .setCustomId(CFG_IDS.SUBMIT_BOOST_MODAL)
      .setTitle('✏️ Edit Kartu Booster')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('b_subtitle')
            .setLabel('Subtitle (THANKS BOOSTER SERVER)')
            .setValue(s.boost.subtitle)
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('b_bg')
            .setLabel('Custom Background URL (Opsional)')
            .setValue(s.boost.backgroundImageUrl || '')
            .setStyle(TextInputStyle.Short)
            .setRequired(false),
        ),
      );
    await interaction.showModal(modal);
  }

  async showTempVoiceModal(interaction) {
    const s = this.store.get(interaction.guildId);
    const modal = new ModalBuilder()
      .setCustomId(CFG_IDS.SUBMIT_TV_MODAL)
      .setTitle('✏️ Edit Nama & Limit Room')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('tv_name_tpl')
            .setLabel('Template Nama Room ({username})')
            .setValue(s.tempvoice.channelNameTemplate)
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('tv_def_limit')
            .setLabel('Default Member Limit / Room (0 = Unlimited)')
            .setValue(String(s.tempvoice.defaultLimit))
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('tv_max_rooms')
            .setLabel('Batas Maksimal Room Server (0 = Unlimited)')
            .setValue(String(s.tempvoice.maxRooms || 0))
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
      );
    await interaction.showModal(modal);
  }

  // ── Interaction Dispatcher ────────────────────────────────────────────────

  async handleInteraction(interaction) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    // 1. Tombol Navigasi Menu
    if (interaction.isButton()) {
      switch (interaction.customId) {
        case CFG_IDS.MENU_WELCOME:
          await interaction.update(this.buildWelcomeDashboard(guildId));
          return;

        case CFG_IDS.MENU_BOOST:
          await interaction.update(this.buildBoostDashboard(guildId));
          return;

        case CFG_IDS.MENU_TV:
          await interaction.update(this.buildTempVoiceDashboard(guildId));
          return;

        case CFG_IDS.BACK_MAIN:
        case CFG_IDS.REFRESH:
          await interaction.update(this.buildMainDashboard(guildId, interaction.guild.name));
          return;

        // Welcome toggles & modals
        case CFG_IDS.TOGGLE_WELCOME: {
          const s = this.store.get(guildId);
          this.store.set(guildId, { welcome: { enabled: !s.welcome.enabled } });
          await interaction.update(this.buildWelcomeDashboard(guildId));
          return;
        }

        case CFG_IDS.TOGGLE_GOODBYE: {
          const s = this.store.get(guildId);
          this.store.set(guildId, { goodbye: { enabled: !s.goodbye.enabled } });
          await interaction.update(this.buildWelcomeDashboard(guildId));
          return;
        }

        case CFG_IDS.MODAL_WELCOME:
          await this.showWelcomeModal(interaction);
          return;

        case CFG_IDS.MODAL_GOODBYE:
          await this.showGoodbyeModal(interaction);
          return;

        case CFG_IDS.TEST_WELCOME: {
          const s = this.store.get(guildId);
          const previewLabel = new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent('-# 👁️ Preview Pesan Welcome'),
            );
          const container = this.welcomeBuilder.buildWelcomeContainer(interaction.member, s.welcome);
          await interaction.reply({
            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            components: [previewLabel, container],
          });
          return;
        }

        case CFG_IDS.TEST_GOODBYE: {
          const s = this.store.get(guildId);
          const previewLabel = new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent('-# 👁️ Preview Pesan Goodbye'),
            );
          const container = this.welcomeBuilder.buildGoodbyeContainer(interaction.member, s.goodbye);
          await interaction.reply({
            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            components: [previewLabel, container],
          });
          return;
        }

        // Booster toggles & modals
        case CFG_IDS.TOGGLE_BOOST: {
          const s = this.store.get(guildId);
          this.store.set(guildId, { boost: { enabled: !s.boost.enabled } });
          await interaction.update(this.buildBoostDashboard(guildId));
          return;
        }

        case CFG_IDS.TOGGLE_THEME: {
          const s = this.store.get(guildId);
          const nextTheme = s.boost.theme === 'dark' ? 'light' : 'dark';
          this.store.set(guildId, { boost: { theme: nextTheme } });
          await interaction.update(this.buildBoostDashboard(guildId));
          return;
        }

        case CFG_IDS.TOGGLE_UNBOOST: {
          const s = this.store.get(guildId);
          this.store.set(guildId, { boost: { unboostNotify: !s.boost.unboostNotify } });
          await interaction.update(this.buildBoostDashboard(guildId));
          return;
        }

        case CFG_IDS.MODAL_BOOST:
          await this.showBoostModal(interaction);
          return;

        case CFG_IDS.TEST_BOOST: {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const s = this.store.get(guildId);
          const currentBoosts = interaction.guild.premiumSubscriptionCount || 3;
          const buffer = await this.boostGenerator.generateBoostCard({
            member: interaction.member,
            currentBoosts,
            nextTierTarget: 7,
            nextTierLabel: 'Menuju Level 2',
            currentTierLabel: 'Level 1',
            options: {
              theme: s.boost.theme,
              titleHeader: s.boost.titleHeader,
              subtitle: s.boost.subtitle,
              backgroundImageUrl: s.boost.backgroundImageUrl,
            },
          });
          const file = new AttachmentBuilder(buffer, { name: 'test-boost.png' });
          await interaction.editReply({
            content: `👁️ **Preview Kartu Booster (${s.boost.theme.toUpperCase()}):**`,
            files: [file],
          });
          return;
        }

        case CFG_IDS.TEST_UNBOOST: {
          const container = new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `# 💔 Server Boost Expired\n\n` +
                `Masa server boost dari ${interaction.member} telah **berakhir** atau dilepas.\n\n` +
                `📊 **Sisa Boost Server:** \`2 Boosts\`\n` +
                `🏆 **Level Server Saat Ini:** \`Level 1\``,
              ),
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `-# ${interaction.guild.name} • Boost Logger`,
              ),
            );

          await interaction.reply({
            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            components: [container],
          });
          return;
        }

        // Temp Voice toggles & modals
        case CFG_IDS.TOGGLE_TV: {
          const s = this.store.get(guildId);
          this.store.set(guildId, { tempvoice: { enabled: !s.tempvoice.enabled } });
          await interaction.update(this.buildTempVoiceDashboard(guildId));
          return;
        }

        case CFG_IDS.MODAL_TV:
          await this.showTempVoiceModal(interaction);
          return;

        case CFG_IDS.SEND_TV_PANEL: {
          await interaction.deferUpdate();
          const s = this.store.get(guildId);
          const targetChannelId = s.tempvoice.voicePanelChannelId || interaction.channelId;
          const targetChannel = await interaction.guild.channels.fetch(targetChannelId).catch(() => null);
          if (!targetChannel || !targetChannel.isTextBased()) {
            await interaction.followUp({
              content: '❌ Channel teks tidak valid untuk mengirim panel. Pastikan kamu sudah memilih **Text Channel Panel** di bawah.',
              flags: [MessageFlags.Ephemeral],
            });
            return;
          }

          // Kirim panel setup permanen untuk member
          const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
          const setupPanel = new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `# 🎙️ Temporary Voice Control\n\n` +
                `Selamat datang di sistem **Temporary Voice**!\n` +
                `Untuk membuat room voice pribadimu, ikuti langkah berikut:\n\n` +
                `1️⃣ Masuk ke channel **Join to Create** <#${s.tempvoice.hubChannelId || '?'}>\n` +
                `2️⃣ Room voice pribadimu akan otomatis dibuat\n` +
                `3️⃣ Gunakan \`/voice\` di dalam room untuk menampilkan panel kontrol\n\n` +
                `-# Panel kontrol berisi 20+ tombol untuk mengatur nama, limit, privasi, dan lainnya.`,
              ),
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`-# ⚙️ ${interaction.guild.name} • Temp Voice System`),
            );

          await targetChannel.send({
            flags: [MessageFlags.IsComponentsV2],
            components: [setupPanel],
          });

          await interaction.followUp({
            content: `✅ Panel setup permanen berhasil dikirim ke <#${targetChannel.id}>! Member bisa membacanya dan langsung join voice.`,
            flags: [MessageFlags.Ephemeral],
          });
          return;
        }
      }
    }

    // 2. String Select Menus (Dropdown 3 Pilihan Menu Utama)
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === CFG_IDS.MAIN_SELECT) {
        const val = interaction.values[0];
        if (val === 'opt_welcome') {
          await interaction.update(this.buildWelcomeDashboard(guildId));
          return;
        }
        if (val === 'opt_boost') {
          await interaction.update(this.buildBoostDashboard(guildId));
          return;
        }
        if (val === 'opt_tempvoice') {
          await interaction.update(this.buildTempVoiceDashboard(guildId));
          return;
        }
      }
    }

    // 3. Channel Select Menus
    if (interaction.isChannelSelectMenu()) {
      const selectedId = interaction.values[0];

      switch (interaction.customId) {
        case CFG_IDS.SELECT_WELCOME_CH:
          this.store.set(guildId, { welcome: { channelId: selectedId } });
          await interaction.update(this.buildWelcomeDashboard(guildId));
          return;

        case CFG_IDS.SELECT_GOODBYE_CH:
          this.store.set(guildId, { goodbye: { channelId: selectedId } });
          await interaction.update(this.buildWelcomeDashboard(guildId));
          return;

        case CFG_IDS.SELECT_BOOST_CH:
          this.store.set(guildId, { boost: { channelId: selectedId } });
          await interaction.update(this.buildBoostDashboard(guildId));
          return;

        case CFG_IDS.SELECT_TV_HUB:
          this.store.set(guildId, { tempvoice: { hubChannelId: selectedId } });
          await interaction.update(this.buildTempVoiceDashboard(guildId));
          return;

        case CFG_IDS.SELECT_TV_CAT:
          this.store.set(guildId, { tempvoice: { categoryId: selectedId } });
          await interaction.update(this.buildTempVoiceDashboard(guildId));
          return;

        case CFG_IDS.SELECT_TV_PANEL:
          this.store.set(guildId, { tempvoice: { voicePanelChannelId: selectedId } });
          await interaction.update(this.buildTempVoiceDashboard(guildId));
          return;
      }
    }

    // 3. Modal Submissions
    if (interaction.isModalSubmit()) {
      switch (interaction.customId) {
        case CFG_IDS.SUBMIT_WELCOME_MODAL: {
          const title = interaction.fields.getTextInputValue('w_title');
          const description = interaction.fields.getTextInputValue('w_desc');
          const color = interaction.fields.getTextInputValue('w_color');
          const imageUrl = interaction.fields.getTextInputValue('w_image');
          const footer = interaction.fields.getTextInputValue('w_footer');

          this.store.set(guildId, {
            welcome: { title, description, color, imageUrl, footer },
          });

          await interaction.reply({
            content: '✅ Pengaturan pesan **Welcome** berhasil disimpan!',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        case CFG_IDS.SUBMIT_GOODBYE_MODAL: {
          const title = interaction.fields.getTextInputValue('g_title');
          const description = interaction.fields.getTextInputValue('g_desc');
          const color = interaction.fields.getTextInputValue('g_color');
          const imageUrl = interaction.fields.getTextInputValue('g_image');
          const footer = interaction.fields.getTextInputValue('g_footer');

          this.store.set(guildId, {
            goodbye: { title, description, color, imageUrl, footer },
          });

          await interaction.reply({
            content: '✅ Pengaturan pesan **Goodbye** berhasil disimpan!',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        case CFG_IDS.SUBMIT_BOOST_MODAL: {
          const subtitle = interaction.fields.getTextInputValue('b_subtitle');
          const backgroundImageUrl = interaction.fields.getTextInputValue('b_bg');

          this.store.set(guildId, {
            boost: { subtitle, backgroundImageUrl },
          });

          await interaction.reply({
            content: '✅ Pengaturan teks & banner **Server Booster** berhasil disimpan! Tag header otomatis dari username member yang boost.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        case CFG_IDS.SUBMIT_TV_MODAL: {
          const channelNameTemplate = interaction.fields.getTextInputValue('tv_name_tpl');
          const rawLimit = interaction.fields.getTextInputValue('tv_def_limit');
          const defaultLimit = parseInt(rawLimit, 10) || 0;
          const rawMaxRooms = interaction.fields.getTextInputValue('tv_max_rooms');
          const maxRooms = parseInt(rawMaxRooms, 10) || 0;

          this.store.set(guildId, {
            tempvoice: { channelNameTemplate, defaultLimit, maxRooms },
          });

          await interaction.reply({
            content: `✅ Pengaturan **Temp Voice** berhasil disimpan!\n• Default Member Limit: **${defaultLimit === 0 ? 'Unlimited' : defaultLimit}**\n• Kuota Maksimal Room: **${maxRooms === 0 ? 'Unlimited' : maxRooms}**`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      }
    }
  }
}
