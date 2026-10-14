import 'dotenv/config';
import { BotClient } from './client/BotClient.js';
import { CommandHandler } from './client/CommandHandler.js';
import { GuildSettingsStore } from './store/GuildSettingsStore.js';
import { WelcomeService } from './modules/welcome/WelcomeService.js';
import { BoostService } from './modules/boost/BoostService.js';
import { TempVoiceManager } from './modules/tempvoice/TempVoiceManager.js';
import { SetupDashboard } from './modules/setup/SetupDashboard.js';
import { SetupCommand } from './commands/SetupCommand.js';
import { VoiceCommand } from './commands/VoiceCommand.js';

async function bootstrap() {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error('BOT_TOKEN environment variable is not set in .env');

  const clientId = process.env.CLIENT_ID;
  if (!clientId) throw new Error('CLIENT_ID environment variable is not set in .env');

  const store = new GuildSettingsStore();

  const bot = new BotClient((client) => {
    const welcomeService = new WelcomeService(client, store);
    const boostService = new BoostService(client, store);
    const tempVoiceManager = new TempVoiceManager(client, store);

    const setupDashboard = new SetupDashboard(
      store,
      boostService.canvasGenerator,
      welcomeService.embedBuilder,
      tempVoiceManager,
    );

    const setupCommand = new SetupCommand(store, setupDashboard);
    const voiceCommand = new VoiceCommand(tempVoiceManager);

    const commandHandler = new CommandHandler(
      client,
      [setupCommand, voiceCommand],
      clientId,
      setupDashboard,
    );

    return [
      welcomeService,
      boostService,
      tempVoiceManager,
      commandHandler,
    ];
  });

  await bot.login(token);
}

bootstrap().catch((error) => {
  console.error('Fatal error saat bootstrap bot:', error);
  process.exit(1);
});
