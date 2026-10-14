import { AttachmentBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } from 'discord.js';
import { BoostCanvasGenerator } from './BoostCanvasGenerator.js';

/**
 * BoostService — mendeteksi event server boost dan unboost,
 * mengirim kartu banner canvas (Gambar 2 / Gambar 3) saat boost,
 * dan mengirim notifikasi saat boost berakhir / habis (Gambar 4).
 */
export class BoostService {
  constructor(client, store) {
    this.client = client;
    this.store = store;
    this.canvasGenerator = new BoostCanvasGenerator();
  }

  register() {
    this.client.on('guildMemberUpdate', (oldMember, newMember) =>
      this.onGuildMemberUpdate(oldMember, newMember),
    );
  }

  async onGuildMemberUpdate(oldMember, newMember) {
    if (!newMember.guild) return;

    const startedBoosting =
      oldMember.premiumSince === null && newMember.premiumSince !== null;
    const stoppedBoosting =
      oldMember.premiumSince !== null && newMember.premiumSince === null;

    if (startedBoosting) {
      await this.sendBoostNotification(newMember);
    } else if (stoppedBoosting) {
      await this.sendUnboostNotification(newMember);
    }
  }

  /**
   * Mengirim kartu booster dengan canvas progress bar
   */
  async sendBoostNotification(member) {
    try {
      const settings = this.store.get(member.guild.id);
      if (!settings?.boost?.enabled) return;

      const channelId = settings.boost.channelId;
      if (!channelId) return;

      const channel = await this.resolveTextChannel(channelId);
      if (!channel) return;

      const currentBoosts = member.guild.premiumSubscriptionCount || 1;
      const { nextTierTarget, nextTierLabel, currentTierLabel } = this.resolveTiers(currentBoosts);
      const memberName = member.displayName || member.user.username;

      const buffer = await this.canvasGenerator.generateBoostCard({
        member,
        currentBoosts,
        nextTierTarget,
        nextTierLabel,
        currentTierLabel,
        options: {
          theme: settings.boost.theme || 'dark',
          titleHeader: memberName,
          subtitle: settings.boost.subtitle || 'THANKS FOR BOOSTING!',
          backgroundImageUrl: settings.boost.backgroundImageUrl || '',
        },
      });

      const attachment = new AttachmentBuilder(buffer, { name: 'boost-card.png' });

      // Kirim publik — semua member bisa lihat
      await channel.send({
        content:
          `💖 **${memberName}** baru saja me-boost server! ${member}\n` +
          `🏆 **Level Server:** \`${currentTierLabel}\` • 🎯 **Boost:** \`${currentBoosts}\` • Menuju: \`${nextTierLabel}\``,
        files: [attachment],
      });
    } catch (error) {
      console.error('[BoostService] Gagal mengirim notifikasi boost:', error);
    }
  }


  /**
   * Mengirim notifikasi saat booster sudah habis / unboost
   */
  async sendUnboostNotification(member) {
    try {
      const settings = this.store.get(member.guild.id);
      if (!settings?.boost?.enabled || settings?.boost?.unboostNotify === false) return;

      const channelId = settings.boost.channelId;
      if (!channelId) return;

      const channel = await this.resolveTextChannel(channelId);
      if (!channel) return;

      const currentBoosts = member.guild.premiumSubscriptionCount || 0;
      const { currentTierLabel } = this.resolveTiers(currentBoosts);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# 💔 Server Boost Expired\n\n` +
            `Masa server boost dari ${member} telah **berakhir** atau dilepas.\n\n` +
            `📊 **Sisa Boost Server:** \`${currentBoosts} Boosts\`\n` +
            `🏆 **Level Server Saat Ini:** \`${currentTierLabel}\``,
          ),
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# ${member.guild.name} • Boost Logger`,
          ),
        );

      await channel.send({
        flags: [MessageFlags.IsComponentsV2],
        components: [container],
      });
    } catch (error) {
      console.error('[BoostService] Gagal mengirim notifikasi unboost:', error);
    }
  }

  resolveTiers(currentBoosts) {
    if (currentBoosts < 2) {
      return {
        nextTierTarget: 2,
        nextTierLabel: 'Menuju Level 1 (2 Boosts)',
        currentTierLabel: 'Level 0',
      };
    }
    if (currentBoosts < 7) {
      return {
        nextTierTarget: 7,
        nextTierLabel: 'Menuju Level 2 (7 Boosts)',
        currentTierLabel: 'Level 1',
      };
    }
    return {
      nextTierTarget: 14,
      nextTierLabel: 'Menuju Level 3 (14 Boosts)',
      currentTierLabel: currentBoosts >= 14 ? 'Level 3 (Max)' : 'Level 2',
    };
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
