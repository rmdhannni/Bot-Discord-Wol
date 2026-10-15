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
  HISTORY_WELCOME: 'cfg_history_welcome',
  HISTORY_GOODBYE: 'cfg_history_goodbye',
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
  EDIT_TV_SETUP_LAYOUT: 'cfg_modal_tempvoice_setup_layout',
  HISTORY_TV_SETUP: 'cfg_history_tempvoice_setup',

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
    this.layoutDrafts = new Map();
  }

  getMessageLayoutElements(settings) {
    if (Array.isArray(settings.layout) && settings.layout.length) {
      return settings.layout.map((element) => ({ ...element }));
    }
    if (typeof settings.layout === 'string' && settings.layout.trim()) {
      return this.welcomeBuilder.parseLayout(settings.layout);
    }

    const lines = [`HEADER: ${settings.title || ''}`, `TEXT: ${settings.description || ''}`];
    if (settings.footer?.trim()) lines.push('SEPARATOR', `FOOTER: ${settings.footer}`);
    return this.welcomeBuilder.parseLayout(lines.join('\n'));
  }

  getTempVoiceSetupLayoutElements(settings) {
    if (Array.isArray(settings.setupPanelLayout) && settings.setupPanelLayout.length) {
      return settings.setupPanelLayout.map((element) => ({ ...element }));
    }
    return [
      { type: 'header', content: '🎙️ Temporary Voice Control' },
      { type: 'text', content: 'Selamat datang di sistem **Temporary Voice**!' },
      { type: 'text', content: 'Untuk membuat room voice pribadimu, ikuti langkah berikut:' },
      { type: 'text', content: '1️⃣ Masuk ke channel **Join to Create** {hubChannel}' },
      { type: 'text', content: '2️⃣ Room voice pribadimu akan otomatis dibuat' },
      { type: 'text', content: '3️⃣ Gunakan `/voice` di dalam room untuk menampilkan panel kontrol' },
      { type: 'separator' },
      { type: 'footer', content: 'Panel kontrol berisi 20+ tombol untuk mengatur nama, limit, privasi, dan lainnya.\n⚙️ {server} • Temp Voice System' },
    ];
  }

  buildTempVoiceSetupPanel(guild, settings, elements = this.getTempVoiceSetupLayoutElements(settings), color = settings.setupPanelColor || '#5865F2') {
    const replacements = {
      '{server}': guild.name,
      '{hubChannel}': settings.hubChannelId ? `<#${settings.hubChannelId}>` : '`Belum diatur`',
    };
    const safeColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#5865F2';
    const container = new ContainerBuilder().setAccentColor(Number.parseInt(safeColor.slice(1), 16));
    for (const element of elements) {
      if (element.type === 'separator') {
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
        continue;
      }
      let content = String(element.content || '');
      for (const [token, value] of Object.entries(replacements)) content = content.replaceAll(token, value);
      if (element.type === 'header') content = `# ${content}`;
      if (element.type === 'footer') content = `-# ${content}`;
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
    }
    return container;
  }

  getLayoutDraftKey(interaction, type) {
    return `${interaction.guildId}:${interaction.user.id}:${type}`;
  }

  renderLayoutEditor(interaction, type, status = '') {
    const key = this.getLayoutDraftKey(interaction, type);
    const draft = this.layoutDrafts.get(key);
    if (!draft) return null;

    const isSetupPanel = type === 'tempvoice_setup';
    const title = isSetupPanel ? 'Panduan Temporary Voice' : type === 'welcome' ? 'Welcome' : 'Goodbye';
    const blockNames = { header: 'Header', text: 'Text', footer: 'Footer', separator: 'Separator' };
    const blockLines = draft.elements.length
      ? draft.elements.map((element, index) => {
        const selected = index === draft.selectedIndex ? ' **(dipilih)**' : '';
        const value = element.type === 'separator'
          ? 'Garis pemisah'
          : String(element.content || '').replace(/\s+/g, ' ').slice(0, 180) || '(kosong)';
        return `**${index + 1}. ${blockNames[element.type] || 'Text'}**${selected}\n> ${value}`;
      }).join('\n')
      : '_Belum ada elemen. Tambahkan dari menu di bawah._';
    const content = [
      `# Editor ${title}`,
      'Pilih elemen untuk menambahkannya, lalu atur urutan dan isi. Perubahan baru tersimpan setelah menekan **Simpan**.',
      `\n${blockLines}`,
      isSetupPanel
        ? `\nWarna Hex panel: \`${draft.color}\``
        : `\nWarna aksen: \`${draft.color}\` • Banner: ${draft.imageUrl ? 'diatur' : 'tidak ada'}`,
      status ? `\n${status}` : '',
      isSetupPanel
        ? '\nToken yang bisa dipakai: `{server}`, `{hubChannel}`.'
        : '\nToken yang bisa dipakai: `{user}`, `{username}`, `{server}`, `{count}`, `{userId}`.',
    ].join('\n');

    const addRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`cfg_le_add_${type}`)
        .setPlaceholder('Tambah elemen...')
        .addOptions([
          { label: 'Header', value: 'header', description: 'Judul besar di pesan' },
          { label: 'Text', value: 'text', description: 'Teks isi pesan' },
          { label: 'Footer', value: 'footer', description: 'Teks kecil di bagian bawah' },
          { label: 'Separator', value: 'separator', description: 'Garis pemisah antar elemen' },
        ]),
    );
    const selectRow = draft.elements.length
      ? new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`cfg_le_select_${type}`)
          .setPlaceholder('Pilih elemen untuk diedit atau dipindahkan...')
          .addOptions(draft.elements.map((element, index) => ({
            label: `${index + 1}. ${blockNames[element.type] || 'Text'}`.slice(0, 100),
            value: String(index),
            description: element.type === 'separator'
              ? 'Pemisah'
              : String(element.content || '').replace(/\s+/g, ' ').slice(0, 90) || '(kosong)',
            default: index === draft.selectedIndex,
          }))),
      )
      : null;
    const editRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`cfg_le_up_${type}`).setLabel('Naik').setStyle(ButtonStyle.Secondary).setDisabled(draft.selectedIndex <= 0),
      new ButtonBuilder().setCustomId(`cfg_le_down_${type}`).setLabel('Turun').setStyle(ButtonStyle.Secondary).setDisabled(draft.selectedIndex < 0 || draft.selectedIndex >= draft.elements.length - 1),
      new ButtonBuilder().setCustomId(`cfg_le_edit_${type}`).setLabel('Edit isi').setStyle(ButtonStyle.Secondary).setDisabled(draft.selectedIndex < 0 || draft.elements[draft.selectedIndex]?.type === 'separator'),
      new ButtonBuilder().setCustomId(`cfg_le_remove_${type}`).setLabel('Hapus elemen').setStyle(ButtonStyle.Danger).setDisabled(draft.selectedIndex < 0),
    );
    const actionButtons = [
      new ButtonBuilder().setCustomId(`cfg_le_preview_${type}`).setLabel('Preview').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`cfg_le_style_${type}`).setLabel(isSetupPanel ? 'Warna Hex' : 'Warna / Banner').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`cfg_le_clear_${type}`).setLabel('Kosongkan').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`cfg_le_save_${type}`).setLabel('Simpan').setStyle(ButtonStyle.Success),
    ];
    const actionRow = new ActionRowBuilder().addComponents(...actionButtons);
    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(addRow);
    if (selectRow) container.addActionRowComponents(selectRow);
    container.addActionRowComponents(editRow, actionRow);
    return { flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral], components: [container] };
  }

  async startLayoutEditor(interaction, type) {
    const guildSettings = this.store.get(interaction.guildId);
    const settings = type === 'tempvoice_setup' ? guildSettings.tempvoice : guildSettings[type];
    const key = this.getLayoutDraftKey(interaction, type);
    this.layoutDrafts.set(key, {
      elements: (type === 'tempvoice_setup'
        ? this.getTempVoiceSetupLayoutElements(settings)
        : this.getMessageLayoutElements(settings)).slice(0, 8),
      selectedIndex: -1,
      color: type === 'tempvoice_setup'
        ? settings.setupPanelColor || '#5865F2'
        : settings.color || (type === 'welcome' ? '#5865F2' : '#ED4245'),
      imageUrl: settings.imageUrl || '',
    });
    await interaction.reply(this.renderLayoutEditor(interaction, type));
  }

  async handleLayoutEditorInteraction(interaction) {
    const styleSubmit = interaction.customId.match(/^cfg_le_style_submit_(welcome|goodbye|tempvoice_setup)$/);
    const match = styleSubmit
      ? [interaction.customId, 'style_submit', styleSubmit[1], undefined]
      : interaction.customId.match(/^cfg_le_(add|select|up|down|edit|remove|preview|back|style|clear|save|item)_(welcome|goodbye|tempvoice_setup)(?:_(header|text|footer))?$/);
    if (!match) return false;
    const [, action, type, elementType] = match;
    const key = this.getLayoutDraftKey(interaction, type);
    const draft = this.layoutDrafts.get(key);
    if (!draft) {
      await interaction.reply({ content: 'Sesi editor sudah berakhir. Buka kembali editor dari dashboard.', flags: MessageFlags.Ephemeral });
      return true;
    }

    if (interaction.isStringSelectMenu()) {
      if (action === 'select') {
        draft.selectedIndex = Number(interaction.values[0]);
        await interaction.update(this.renderLayoutEditor(interaction, type));
        return true;
      }
      if (action === 'add') {
        const selectedType = interaction.values[0];
        if (draft.elements.length >= 8) {
          await interaction.reply({ content: 'Maksimal 8 elemen di editor ini.', flags: MessageFlags.Ephemeral });
          return true;
        }
        delete draft.editingIndex;
        draft.insertIndex = draft.selectedIndex >= 0 ? draft.selectedIndex + 1 : draft.elements.length;
        if (selectedType === 'separator') {
          const candidate = [...draft.elements];
          candidate.splice(draft.insertIndex, 0, { type: 'separator' });
          draft.elements = candidate;
          draft.selectedIndex = draft.insertIndex;
          await interaction.update(this.renderLayoutEditor(interaction, type));
          return true;
        }
        const modal = new ModalBuilder()
          .setCustomId(`cfg_le_item_${type}_${selectedType}`)
          .setTitle(`Tambah ${selectedType === 'header' ? 'Header' : selectedType === 'footer' ? 'Footer' : 'Text'}`)
          .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('content')
              .setLabel('Isi elemen (token dinamis didukung)')
              .setStyle(TextInputStyle.Paragraph)
              .setMaxLength(1000)
              .setRequired(true),
          ));
        await interaction.showModal(modal);
        return true;
      }
    }

    if (interaction.isModalSubmit()) {
      if (action === 'item') {
        const content = interaction.fields.getTextInputValue('content').trim();
        if (!content) {
          await interaction.reply({ content: 'Isi elemen tidak boleh kosong.', flags: MessageFlags.Ephemeral });
          return true;
        }
        if (Number.isInteger(draft.editingIndex)) {
          draft.elements[draft.editingIndex] = { type: elementType, content };
          draft.selectedIndex = draft.editingIndex;
          delete draft.editingIndex;
        } else {
          const index = Math.min(draft.insertIndex ?? draft.elements.length, draft.elements.length);
          draft.elements.splice(index, 0, { type: elementType, content });
          draft.selectedIndex = index;
        }
        await interaction.update(this.renderLayoutEditor(interaction, type));
        return true;
      }
      if (action === 'style_submit') {
        const rawColor = interaction.fields.getTextInputValue('color').trim();
        const color = rawColor.startsWith('#') ? rawColor : `#${rawColor}`;
        const imageUrl = type === 'tempvoice_setup' ? '' : interaction.fields.getTextInputValue('image').trim();
        if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
          await interaction.reply({ content: 'Warna harus berupa kode hex 6 digit, contoh `#5865F2`.', flags: MessageFlags.Ephemeral });
          return true;
        }
        if (imageUrl && !this.welcomeBuilder.getImageUrl(imageUrl)) {
          await interaction.reply({ content: 'URL gambar harus URL HTTP/HTTPS yang valid. Gunakan tautan langsung gambar, termasuk `.gif`.', flags: MessageFlags.Ephemeral });
          return true;
        }
        draft.color = color;
        draft.imageUrl = imageUrl;
        await interaction.update(this.renderLayoutEditor(interaction, type));
        return true;
      }
    }

    if (interaction.isButton()) {
      if (action === 'up' || action === 'down') {
        const to = draft.selectedIndex + (action === 'up' ? -1 : 1);
        if (draft.selectedIndex >= 0 && to >= 0 && to < draft.elements.length) {
          [draft.elements[draft.selectedIndex], draft.elements[to]] = [draft.elements[to], draft.elements[draft.selectedIndex]];
          draft.selectedIndex = to;
        }
      } else if (action === 'remove') {
        if (draft.selectedIndex >= 0) {
          draft.elements.splice(draft.selectedIndex, 1);
          draft.selectedIndex = Math.min(draft.selectedIndex, draft.elements.length - 1);
        }
      } else if (action === 'clear') {
        draft.elements = [];
        draft.selectedIndex = -1;
      } else if (action === 'edit') {
        const element = draft.elements[draft.selectedIndex];
        if (element && element.type !== 'separator') {
          const modal = new ModalBuilder()
            .setCustomId(`cfg_le_item_${type}_${element.type}`)
            .setTitle(`Edit ${element.type === 'header' ? 'Header' : element.type === 'footer' ? 'Footer' : 'Text'}`)
            .addComponents(new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('content').setLabel('Isi elemen').setStyle(TextInputStyle.Paragraph).setMaxLength(1000).setValue(String(element.content || '').slice(0, 1000)).setRequired(true),
            ));
          draft.editingIndex = draft.selectedIndex;
          await interaction.showModal(modal);
          return true;
        }
      } else if (action === 'style') {
        const modal = new ModalBuilder()
          .setCustomId(`cfg_le_style_submit_${type}`)
          .setTitle(type === 'tempvoice_setup' ? 'Warna Hex Panel Setup' : 'Warna dan Banner Preview')
          .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('color').setLabel('Warna aksen (Hex)').setStyle(TextInputStyle.Short).setValue(draft.color).setRequired(true),
          ));
        if (type !== 'tempvoice_setup') {
          modal.addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('image').setLabel('URL gambar atau GIF langsung (opsional)').setStyle(TextInputStyle.Short).setMaxLength(4000).setValue(draft.imageUrl).setRequired(false),
          ));
        }
        await interaction.showModal(modal);
        return true;
      } else if (action === 'preview') {
        const guildSettings = this.store.get(interaction.guildId);
        const current = type === 'tempvoice_setup' ? guildSettings.tempvoice : guildSettings[type];
        const options = { ...current, layout: draft.elements, color: draft.color, imageUrl: draft.imageUrl };
        const preview = type === 'tempvoice_setup'
          ? this.buildTempVoiceSetupPanel(interaction.guild, this.store.get(interaction.guildId).tempvoice, draft.elements, draft.color)
          : type === 'welcome'
            ? this.welcomeBuilder.buildWelcomeContainer(interaction.member, options)
            : this.welcomeBuilder.buildGoodbyeContainer(interaction.member, options);
        const backRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`cfg_le_back_${type}`).setLabel('Kembali ke editor').setStyle(ButtonStyle.Secondary),
        );
        preview.addActionRowComponents(backRow);
        await interaction.update({ flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral], components: [preview] });
        return true;
      } else if (action === 'back') {
        await interaction.update(this.renderLayoutEditor(interaction, type));
        return true;
      } else if (action === 'save') {
        if (!draft.elements.some((element) => element.type !== 'separator' && element.content?.trim())) {
          await interaction.reply({ content: 'Tambahkan setidaknya satu elemen teks sebelum menyimpan.', flags: MessageFlags.Ephemeral });
          return true;
        }
        const guildSettings = this.store.get(interaction.guildId);
        const current = type === 'tempvoice_setup' ? guildSettings.tempvoice : guildSettings[type];
        if (type === 'tempvoice_setup') {
          const previous = Array.isArray(current.setupPanelHistory) ? current.setupPanelHistory : [];
          this.store.set(interaction.guildId, {
            tempvoice: {
              setupPanelLayout: draft.elements,
              setupPanelColor: draft.color,
              setupPanelHistory: [{
                editedAt: new Date().toISOString(),
                editedBy: interaction.user.id,
                snapshot: {
                  setupPanelLayout: draft.elements.map((element) => ({ ...element })),
                  setupPanelColor: draft.color,
                },
              }, ...previous].slice(0, 10),
            },
          });
        } else {
          const updated = this.recordEditHistory(current, { layout: draft.elements, color: draft.color, imageUrl: draft.imageUrl }, interaction.user.id);
          this.store.set(interaction.guildId, { [type]: updated });
        }
        const status = type === 'tempvoice_setup'
          ? '✅ Isi panduan berhasil disimpan. Klik "Kirim Panel Sekarang" untuk menerbitkan pesan setup terbaru.'
          : '✅ Pengaturan berhasil disimpan. Riwayat edit diperbarui.';
        await interaction.update(this.renderLayoutEditor(interaction, type, status));
        return true;
      }
      await interaction.update(this.renderLayoutEditor(interaction, type));
      return true;
    }
    return false;
  }

  async refreshTempVoicePanels(guildId) {
    const settings = this.store.get(guildId).tempvoice;
    for (const state of this.tvManager?.activeChannels?.values?.() || []) {
      if (state.channel?.guild?.id !== guildId) continue;
      state.panelColor = settings.panelColor || '#5865F2';
      await this.tvManager.controller.refreshPanel(state);
    }
  }

  summarizeMessageLayout(settings) {
    const elements = this.getMessageLayoutElements(settings);
    const count = (type) => elements.filter((element) => element.type === type).length;
    return `${count('header')} header • ${count('footer')} footer • ${count('separator')} pemisah`;
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
      `Klik **Edit Layout** untuk memilih elemen Header, Text, Footer, dan Separator dari menu. Elemen dapat ditambahkan berkali-kali, disusun ulang, dilihat dalam daftar, lalu di-preview sebelum disimpan.\n\n` +
      `### 🌟 Welcome Settings\n` +
      `• Status: ${s.welcome.enabled ? '🟢 **Aktif**' : '🔴 **Nonaktif**'}\n` +
      `• Channel: ${fmtCh(s.welcome.channelId)}\n` +
      `• Layout: ${this.summarizeMessageLayout(s.welcome)}\n\n` +
      `### 👋 Goodbye Settings\n` +
      `• Status: ${s.goodbye.enabled ? '🟢 **Aktif**' : '🔴 **Nonaktif**'}\n` +
      `• Channel: ${fmtCh(s.goodbye.channelId)}\n` +
      `• Layout: ${this.summarizeMessageLayout(s.goodbye)}`;

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(CFG_IDS.TOGGLE_WELCOME)
        .setLabel(s.welcome.enabled ? 'Nonaktifkan Welcome' : 'Aktifkan Welcome')
        .setStyle(s.welcome.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.MODAL_WELCOME)
        .setLabel('Edit Layout Welcome')
        .setEmoji('✏️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.TEST_WELCOME)
        .setLabel('Preview Welcome')
        .setEmoji('👁️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.HISTORY_WELCOME)
        .setLabel('Riwayat Welcome')
        .setStyle(ButtonStyle.Secondary),
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(CFG_IDS.TOGGLE_GOODBYE)
        .setLabel(s.goodbye.enabled ? 'Nonaktifkan Goodbye' : 'Aktifkan Goodbye')
        .setStyle(s.goodbye.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.MODAL_GOODBYE)
        .setLabel('Edit Layout Goodbye')
        .setEmoji('✏️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.TEST_GOODBYE)
        .setLabel('Preview Goodbye')
        .setEmoji('👁️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.HISTORY_GOODBYE)
        .setLabel('Riwayat Goodbye')
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

  recordEditHistory(current, updated, editorId) {
    const previousHistory = Array.isArray(current.editHistory) ? current.editHistory : [];
    const entry = {
      editedAt: new Date().toISOString(),
      editedBy: editorId,
      snapshot: {
        ...updated,
        layout: Array.isArray(updated.layout)
          ? updated.layout.map((element) => ({ ...element }))
          : updated.layout,
      },
    };
    return { ...updated, editHistory: [entry, ...previousHistory].slice(0, 10) };
  }

  async showEditHistory(interaction, type) {
    const settings = this.store.get(interaction.guildId)[type];
    const title = type === 'welcome' ? 'Welcome' : 'Goodbye';
    const history = Array.isArray(settings.editHistory) ? settings.editHistory : [];
    const lines = history.length
      ? history.map((entry, index) => {
        const snapshot = entry.snapshot || {};
        const editedMs = Date.parse(entry.editedAt);
        const timestamp = Number.isFinite(editedMs) ? Math.floor(editedMs / 1000) : null;
        const editedAt = timestamp ? `<t:${timestamp}:F> (<t:${timestamp}:R>)` : 'Waktu tidak diketahui';
        const editedBy = entry.editedBy ? `<@${entry.editedBy}>` : 'Tidak diketahui';
        const elements = this.getMessageLayoutElements(snapshot);
        const header = elements.find((element) => element.type === 'header')?.content || snapshot.title || 'Custom layout';
        const safeHeader = String(header).replace(/\s+/g, ' ').slice(0, 80);
        const separators = elements.filter((element) => element.type === 'separator').length;
        const headers = elements.filter((element) => element.type === 'header').length;
        const footers = elements.filter((element) => element.type === 'footer').length;
        return `**${index + 1}. ${editedAt}** • oleh ${editedBy}\n> ${safeHeader} • ${headers} header • ${footers} footer • ${separators} separator • ${snapshot.color || '-'}`;
      })
      : ['Belum ada perubahan yang tercatat. Riwayat akan dibuat setelah pengaturan disimpan.'];

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### Riwayat Edit ${title}\n\n${lines.join('\n\n')}`),
    );
    await interaction.reply({
      flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
      components: [container],
    });
  }

  async showTempVoiceSetupHistory(interaction) {
    const history = this.store.get(interaction.guildId).tempvoice.setupPanelHistory || [];
    const lines = history.length
      ? history.map((entry, index) => {
        const timestamp = Date.parse(entry.editedAt);
        const date = Number.isFinite(timestamp) ? `<t:${Math.floor(timestamp / 1000)}:F>` : 'Waktu tidak diketahui';
        const blocks = Array.isArray(entry.snapshot?.setupPanelLayout) ? entry.snapshot.setupPanelLayout : [];
        const counts = (type) => blocks.filter((block) => block.type === type).length;
        const editor = entry.editedBy ? `<@${entry.editedBy}>` : 'Tidak diketahui';
        const color = entry.snapshot?.setupPanelColor || '#5865F2';
        return `**${index + 1}. ${date}** • oleh ${editor}\n> ${counts('header')} header • ${counts('footer')} footer • ${counts('separator')} separator • ${color}`;
      })
      : ['Belum ada perubahan panduan setup Temporary Voice yang tercatat.'];
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### Riwayat Edit Panduan Temporary Voice\n\n${lines.join('\n\n')}`),
    );
    await interaction.reply({ flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral], components: [container] });
  }

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
      `• Header Kartu: \`${s.boost.titleHeader || '{username}'}\`\n` +
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
      new ButtonBuilder()
        .setCustomId(CFG_IDS.EDIT_TV_SETUP_LAYOUT)
        .setLabel('Edit Pesan Setup')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(CFG_IDS.HISTORY_TV_SETUP)
        .setLabel('Riwayat Pesan')
        .setStyle(ButtonStyle.Secondary),
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
    await this.startLayoutEditor(interaction, 'welcome');
  }

  async showGoodbyeModal(interaction) {
    await this.startLayoutEditor(interaction, 'goodbye');
  }

  async showBoostModal(interaction) {
    const s = this.store.get(interaction.guildId);
    const modal = new ModalBuilder()
      .setCustomId(CFG_IDS.SUBMIT_BOOST_MODAL)
      .setTitle('✏️ Edit Kartu Booster')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('b_header')
            .setLabel('Header ({username} / {server} bisa dinamis)')
            .setValue(s.boost.titleHeader || '{username}')
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
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
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('tv_panel_color')
            .setLabel('Warna aksen panel (Hex, contoh #5865F2)')
            .setValue(s.tempvoice.panelColor || '#5865F2')
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

    if (interaction.customId?.startsWith('cfg_le_')) {
      const handled = await this.handleLayoutEditorInteraction(interaction);
      if (handled) return;
    }

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

        case CFG_IDS.HISTORY_WELCOME:
          await this.showEditHistory(interaction, 'welcome');
          return;

        case CFG_IDS.HISTORY_GOODBYE:
          await this.showEditHistory(interaction, 'goodbye');
          return;

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

        case CFG_IDS.EDIT_TV_SETUP_LAYOUT:
          await this.startLayoutEditor(interaction, 'tempvoice_setup');
          return;

        case CFG_IDS.HISTORY_TV_SETUP:
          await this.showTempVoiceSetupHistory(interaction);
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

          // Kirim panel panduan setup permanen, terpisah dari UI kontrol voice room.
          const setupPanel = this.buildTempVoiceSetupPanel(interaction.guild, s.tempvoice);

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
          const layout = interaction.fields.getTextInputValue('w_layout').trim();
          const layoutBlocks = this.welcomeBuilder.parseLayout(layout);
          if (layoutBlocks.length > 8 || !layoutBlocks.some((block) => block.type !== 'separator' && block.content.trim())) {
            await interaction.reply({ content: 'Layout harus berisi teks dan maksimal 8 blok agar muat di pesan Discord.', flags: MessageFlags.Ephemeral });
            return;
          }
          const rawColor = interaction.fields.getTextInputValue('w_color').trim();
          const color = rawColor.startsWith('#') ? rawColor : `#${rawColor}`;
          if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
            await interaction.reply({ content: 'Warna Welcome harus berupa kode hex 6 digit, misalnya `#5865F2`.', flags: MessageFlags.Ephemeral });
            return;
          }
          const imageUrl = interaction.fields.getTextInputValue('w_image').trim();

          const current = this.store.get(guildId).welcome;
          const updated = this.recordEditHistory(
            current,
            { layout, color, imageUrl },
            interaction.user.id,
          );
          this.store.set(guildId, { welcome: updated });

          await interaction.reply({
            content: '✅ Pengaturan pesan **Welcome** berhasil disimpan!',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        case CFG_IDS.SUBMIT_GOODBYE_MODAL: {
          const layout = interaction.fields.getTextInputValue('g_layout').trim();
          const layoutBlocks = this.welcomeBuilder.parseLayout(layout);
          if (layoutBlocks.length > 8 || !layoutBlocks.some((block) => block.type !== 'separator' && block.content.trim())) {
            await interaction.reply({ content: 'Layout harus berisi teks dan maksimal 8 blok agar muat di pesan Discord.', flags: MessageFlags.Ephemeral });
            return;
          }
          const rawColor = interaction.fields.getTextInputValue('g_color').trim();
          const color = rawColor.startsWith('#') ? rawColor : `#${rawColor}`;
          if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
            await interaction.reply({ content: 'Warna Goodbye harus berupa kode hex 6 digit, misalnya `#ED4245`.', flags: MessageFlags.Ephemeral });
            return;
          }
          const imageUrl = interaction.fields.getTextInputValue('g_image').trim();

          const current = this.store.get(guildId).goodbye;
          const updated = this.recordEditHistory(
            current,
            { layout, color, imageUrl },
            interaction.user.id,
          );
          this.store.set(guildId, { goodbye: updated });

          await interaction.reply({
            content: '✅ Pengaturan pesan **Goodbye** berhasil disimpan!',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        case CFG_IDS.SUBMIT_BOOST_MODAL: {
          const titleHeader = interaction.fields.getTextInputValue('b_header').trim();
          const subtitle = interaction.fields.getTextInputValue('b_subtitle');
          const backgroundImageUrl = interaction.fields.getTextInputValue('b_bg');

          this.store.set(guildId, {
            boost: { titleHeader, subtitle, backgroundImageUrl },
          });

          await interaction.reply({
            content: '✅ Pengaturan header, subtitle, dan banner **Server Booster** berhasil disimpan. Gunakan `{username}` atau `{server}` pada header untuk mengisinya secara dinamis.',
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
          const panelColor = interaction.fields.getTextInputValue('tv_panel_color').trim();
          if (!/^#[0-9a-fA-F]{6}$/.test(panelColor)) {
            await interaction.reply({ content: 'Warna panel harus berupa kode hex 6 digit, misalnya `#5865F2`.', flags: MessageFlags.Ephemeral });
            return;
          }

          this.store.set(guildId, {
            tempvoice: { channelNameTemplate, defaultLimit, maxRooms, panelColor },
          });
          await this.refreshTempVoicePanels(guildId);

          await interaction.reply({
            content: `✅ Pengaturan **Temp Voice** berhasil disimpan!\n• Default Member Limit: **${defaultLimit === 0 ? 'Unlimited' : defaultLimit}**\n• Kuota Maksimal Room: **${maxRooms === 0 ? 'Unlimited' : maxRooms}**\n• Warna panel: **${panelColor}**`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      }
    }
  }
}
