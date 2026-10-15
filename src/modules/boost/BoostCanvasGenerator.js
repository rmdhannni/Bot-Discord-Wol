import { createCanvas, loadImage } from '@napi-rs/canvas';

/**
 * BoostCanvasGenerator — Menghasilkan banner kartu booster server
 * sesuai UI pada Gambar 2 (Dark Grunge) dan Gambar 3 (White Splatter).
 */
export class BoostCanvasGenerator {
  constructor() {
    this.width = 850;
    this.height = 200;
  }

  /**
   * Menghasilkan buffer gambar PNG untuk notifikasi booster
   * @param {Object} params
   * @param {import('discord.js').GuildMember} params.member
   * @param {number} params.currentBoosts
   * @param {number} params.nextTierTarget
   * @param {string} params.nextTierLabel
   * @param {string} params.currentTierLabel
   * @param {Object} [params.options]
   */
  async generateBoostCard({ member, currentBoosts, nextTierTarget, nextTierLabel, currentTierLabel, options = {} }) {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    const theme = options.theme || 'dark'; // 'dark' (Gambar 2) | 'light' (Gambar 3)
    const titleHeader = (options.titleHeader || '{username}')
      .replaceAll('{username}', member.displayName || member.user.username)
      .replaceAll('{server}', member.guild.name);
    const subtitle = options.subtitle || 'THANKS BOOSTER SERVER';
    const bgUrl = options.backgroundImageUrl || '';

    // 1. Gambar Background
    await this.drawBackground(ctx, theme, bgUrl);

    // 2. Gambar Ornamen & Grunge
    this.drawThemeEffects(ctx, theme);

    // 3. Gambar Avatar Pengguna
    await this.drawAvatar(ctx, member, theme);

    // 4. Gambar Garis Pembatas Vertikal
    this.drawDivider(ctx, theme);

    // 5. Gambar Teks (Header, Subtitle, Username)
    this.drawTexts(ctx, { member, titleHeader, subtitle, theme });

    // 6. Gambar Progress Bar
    this.drawProgressBar(ctx, {
      currentBoosts,
      nextTierTarget,
      nextTierLabel,
      currentTierLabel,
      theme,
    });

    return canvas.toBuffer('image/png');
  }

  async drawBackground(ctx, theme, bgUrl) {
    if (bgUrl && bgUrl.trim().startsWith('http')) {
      try {
        const bg = await loadImage(bgUrl.trim());
        ctx.drawImage(bg, 0, 0, this.width, this.height);
        // Dim overlay agar teks selalu terbaca
        ctx.fillStyle = theme === 'dark' ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.65)';
        ctx.fillRect(0, 0, this.width, this.height);
        return;
      } catch (err) {
        console.warn('[BoostCanvas] Gagal memuat background kustom, menggunakan default.');
      }
    }

    if (theme === 'dark') {
      // Dark grunge gradient (Gambar 2)
      const grad = ctx.createLinearGradient(0, 0, this.width, this.height);
      grad.addColorStop(0, '#0a0a0c');
      grad.addColorStop(0.5, '#121217');
      grad.addColorStop(1, '#08080a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      // White canvas (Gambar 3)
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawThemeEffects(ctx, theme) {
    if (theme === 'dark') {
      // Vignette & subtle particles/grunge
      ctx.save();
      const vignette = ctx.createRadialGradient(
        this.width / 2, this.height / 2, 100,
        this.width / 2, this.height / 2, this.width / 1.5
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, this.width, this.height);

      // Subtle border frame
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 8, this.width - 16, this.height - 16);
      ctx.restore();
    } else {
      // Light theme ink splatters (Gambar 3)
      ctx.save();
      ctx.fillStyle = '#111111';

      // Splatters di sudut kanan & kiri
      const drawSplatter = (cx, cy, r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      };

      // Kiri
      drawSplatter(20, 30, 8);
      drawSplatter(15, 60, 5);
      drawSplatter(35, 170, 7);
      drawSplatter(18, 140, 4);

      // Kanan
      drawSplatter(this.width - 25, 30, 9);
      drawSplatter(this.width - 15, 70, 6);
      drawSplatter(this.width - 35, 160, 8);
      drawSplatter(this.width - 20, 130, 4);

      ctx.restore();
    }
  }

  async drawAvatar(ctx, member, theme) {
    const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    let avatar;
    try {
      avatar = await loadImage(avatarUrl);
    } catch {
      // Fallback placeholder jika fetch avatar gagal
      avatar = null;
    }

    const cx = 110;
    const cy = this.height / 2;
    const radius = 62;

    ctx.save();

    // Ring Outer Glow / Stroke
    if (theme === 'dark') {
      // Outer glow
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Ink brush circle (Gambar 3)
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Clip circular avatar
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (avatar) {
      ctx.drawImage(avatar, cx - radius, cy - radius, radius * 2, radius * 2);
    } else {
      ctx.fillStyle = theme === 'dark' ? '#333333' : '#cccccc';
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    }

    ctx.restore();
  }

  drawDivider(ctx, theme) {
    const x = 205;
    ctx.save();
    ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 32);
    ctx.lineTo(x, this.height - 32);
    ctx.stroke();
    ctx.restore();
  }

  drawTexts(ctx, { member, titleHeader, subtitle, theme }) {
    const textX = 225;
    const isDark = theme === 'dark';

    ctx.save();

    // 1. Title Header (e.g. 11DKK)
    ctx.fillStyle = isDark ? '#ffffff' : '#0a0a0a';
    ctx.font = '900 36px Impact, Arial Black, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(titleHeader.toUpperCase(), textX, 62);

    // 2. Subtitle (e.g. THANKS BOOSTER SERVER)
    ctx.fillStyle = isDark ? '#f0f0f0' : '#1a1a1a';
    ctx.font = 'italic 700 22px Arial, sans-serif';
    ctx.letterSpacing = '1.5px';
    ctx.fillText(subtitle.toUpperCase(), textX, 96);

    // 3. Username / Member Name (e.g. bintang)
    ctx.fillStyle = isDark ? '#b0b3b8' : '#444444';
    const memberName = member.displayName || member.user.username;
    ctx.font = '500 18px Arial, sans-serif';
    ctx.fillText(memberName, textX, 125);

    ctx.restore();
  }

  drawProgressBar(ctx, { currentBoosts, nextTierTarget, nextTierLabel, currentTierLabel, theme }) {
    const barX = 225;
    const barY = 145;
    const barWidth = this.width - barX - 45;
    const barHeight = 14;
    const radius = barHeight / 2;
    const isDark = theme === 'dark';

    // Hitung progress
    const target = Math.max(nextTierTarget, 1);
    const progress = Math.min(Math.max(currentBoosts / target, 0.05), 1);
    const fillWidth = Math.max(barWidth * progress, barHeight);

    ctx.save();

    // Track
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)';
    this.fillRoundedRect(ctx, barX, barY, barWidth, barHeight, radius);

    // Fill
    ctx.fillStyle = isDark ? '#ffffff' : '#111111';
    this.fillRoundedRect(ctx, barX, barY, fillWidth, barHeight, radius);

    // Level Target / Progress Text di samping kanan bar
    ctx.fillStyle = isDark ? '#a0a0a0' : '#555555';
    ctx.font = '12px Arial, sans-serif';
    const label = `${currentBoosts}/${target} Boosts • ${nextTierLabel}`;
    ctx.fillText(label, barX, barY + barHeight + 18);

    ctx.restore();
  }

  fillRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fill();
  }
}
