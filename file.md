# 🤖 Panduan Lengkap Bot Discord WOL (Node.js ES Modules)

Bot Discord modern yang dibangun dengan **Node.js (ES Modules)**, **discord.js v14**, dan **@napi-rs/canvas**. Seluruh konfigurasi fitur berbasis UI interaktif di chat (tombol, dropdown, dan modal pop-up kustom).

---

## 🚀 Cara Menjalankan Bot

Pastikan dependensi sudah terinstall:
```bash
npm install
```

Jalankan bot:
```bash
# Menjalankan bot langsung
npm start

# Mode development (auto-reload saat ada perubahan file)
npm run dev
```

---

## 🌟 Fitur-Fitur Utama

### 1. ⚙️ Interactive Configuration Dashboard (`/setup`)
Satu perintah tunggal tanpa subcommand rumit:
- Cukup ketik **/setup** di Discord.
- Otomatis muncul **Menu Dropdown dengan 3 Pilihan Fitur** (serta 3 tombol aksi cepat):
  1. 👋 **Welcome & Goodbye**: Kelola pesan welcome/goodbye, pilih channel, dan edit pesan via **Modal Pop-up kustom**.
  2. 💖 **Server Booster**: Kelola notifikasi boost & unboost, pilih tema (Dark Grunge / Light Splatter), edit tag header/subtitle, dan test banner canvas.
  3. 🎙️ **Temporary Voice**: Kelola hub voice, kategori, panel channel, edit format nama/limit via modal, dan kirim panel kontrol.
- Saat salah satu dari 3 opsi dipilih, bot langsung membuka UI kontrol interaktif dan pop-up yang sesuai di dalam obrolan!

### 2. 🎙️ Temporary Voice Channel (Embed Container V2 Sesuai Gambar 1)
- **Komponen Container V2**: Tombol emote terintegrasi **langsung di dalam kotak embed container** (`ContainerBuilder` Type 17) menggunakan Discord Components V2.
- **Panel Kontrol Eksklusif (4 Baris × 5 Tombol = 20 Tombol)**:
  - **Baris 1**: 🔀 `NAME` · 👥 `LIMIT` · 🛡️ `PRIVACY` · ⏱️ `WAIT` · 💬 `CHAT`
  - **Baris 2**: 👤 `TRUST` · 🚫 `UNTRUST` · 📞 `INVITE` · 👢 `KICK` · 🌐 `REGION`
  - **Baris 3**: ⛔ `BLOCK` · 🔓 `UNBLOCK` · 👑 `CLAIM` · 🔁 `TRANSFER` · 🗑️ `DELETE` (Danger)
  - **Baris 4**: 🔐 `LOCK` · 🎮 `ACTIVITY` · 📊 `STATS` · 📝 `TOPIC` · 🔔 `NOTIFY`
- **Recall Panel**: Pengguna dapat memanggil kembali panel kontrol kapan saja dengan:
  - Slash command: `/voice`
  - Mengetik di chat: `control panel` atau `kontrol panel`
- **Auto Cleanup**: Saat room kosong (tidak ada member tersisa), bot otomatis menghapus channel.

### 3. 💖 Server Booster & Unboost Notification (UI Sesuai Gambar 2, 3, & 4)
- **Booster Card Canvas (Gambar 2 & 3)**:
  - Menghasilkan kartu gambar banner estetik dengan rasio lebar.
  - **Avatar Lingkaran** dengan glowing ring / brush ring.
  - **Tag Header** (kustom, default: `11DKK`).
  - **Subtitle** (kustom, default: `THANKS BOOSTER SERVER`).
  - **Nama Member** (display name/username).
  - **Progress Bar Tingkat Boost** (progres menuju Tier 1/2/3).
  - Pilihan tema: **Dark Grunge** (Gambar 2) dan **Light Splatter** (Gambar 3).
- **Notifikasi Unboost Otomatis (Gambar 4)**:
  - Saat masa boost member habis atau dilepas, bot otomatis mendeteksi dan mengirimkan embed notifikasi unboost berisi sisa boost dan level server saat ini.

### 4. 👋 Welcome & Goodbye Pop-up Kustom
- Mendeteksi member masuk (`guildMemberAdd`) dan member keluar (`guildMemberRemove`).
- Format embed dapat diubah bebas langsung lewat **Discord Modal Pop-up** di panel `/setup`:
  - Judul embed
  - Deskripsi embed
  - Warna hex
  - URL gambar banner
  - Footer text
- Mendukung placeholder dinamis:
  - `{user}` : Tag mention pengguna (`@user`)
  - `{username}` : Nama pengguna
  - `{server}` : Nama server
  - `{count}` : Jumlah total member server
  - `{userId}` : ID akun pengguna

---

## 📁 Struktur Folder Proyek

```text
src/
├── client/
│   ├── BotClient.js          # Inisialisasi client Discord & intents
│   └── CommandHandler.js     # Registrasi & dispatcher slash commands & dashboard UI
├── commands/
│   ├── SetupCommand.js       # Perintah /setup (Interactive Dashboard)
│   └── VoiceCommand.js       # Perintah /voice (Recall Temp Voice Panel)
├── modules/
│   ├── boost/
│   │   ├── BoostCanvasGenerator.js # Pembuat banner kartu booster (Dark/Light)
│   │   └── BoostService.js         # Handler event boost & unboost
│   ├── setup/
│   │   └── SetupDashboard.js       # Komponen UI dashboard klik-klik, channel selects & modal pop-up
│   ├── tempvoice/
│   │   ├── TempVoiceChannel.js     # Factory pembuatan & penghapusan voice channel
│   │   ├── TempVoiceController.js  # Tampilan panel 20 tombol (Gambar 1) & modal handlers
│   │   └── TempVoiceManager.js     # Top-level orchestrator voice & chat trigger ("control panel")
│   └── welcome/
│       ├── WelcomeEmbedBuilder.js  # Pembangun embed welcome/goodbye kustom
│       └── WelcomeService.js       # Handler event member masuk & keluar
├── store/
│   └── GuildSettingsStore.js       # Manajemen konfigurasi per-guild (data/guild-settings.json)
└── index.js                        # Entry point utama aplikasi Node.js
```