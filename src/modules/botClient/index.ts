import { messageCommandSelector } from '@modules/messageCommandSelector';
import { config } from '@utils/config';
import { Logger } from '@utils/logger';
import { Client, Events, GatewayIntentBits, TextChannel } from 'discord.js';

class BotClient {
  private logger = new Logger('BotClient').childLogger;

  private client: Client;
  private intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ];

  get user() {
    return this.client.user;
  }

  start = async () => {
    this.client = new Client({ intents: this.intents });
    this.subscribeListeners();
    await this.client.login(config.token);
  };

  getTextChannel = async (id: string) => {
    const channel = (await this.client.channels.fetch(id)) as TextChannel;
    return channel;
  };

  private subscribeListeners = () => {
    this.subscribeOnClientReady();
    this.subscribeOnMessage();
  };

  private subscribeOnClientReady = () => {
    this.client.once(Events.ClientReady, (client) => this.logger.info(`Ready! Logged in as ${client.user.tag}`));
  };

  private subscribeOnMessage = () => {
    this.client.on(Events.MessageCreate, async (message) => {
      try {
        if (message.author.bot || !message.inGuild()) {
          return;
        }
        await messageCommandSelector.start(message);
      } catch (e) {
        if (e instanceof Error) {
          message.reply(e.message);
        }
      }
    });
    this.logger.debug('Subscribe on message complete');
  };
}

export const botClient = new BotClient();
