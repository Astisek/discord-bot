import { slashCommands } from '@data/slashCommands';
import { InteractionCommandSelector } from '@modules/interactionCommandSelector';
import { MessageCommandSelector } from '@modules/messageCommandSelector';
import { config } from '@utils/config';
import { Logger } from '@utils/logger';
import { Client, Events, GatewayIntentBits, REST, Routes, TextChannel } from 'discord.js';

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
    this.subscribeOnInteract();
    this.registerSlashCommands();
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
        const messageCommandSelector = new MessageCommandSelector();
        await messageCommandSelector.start(message);
      } catch (e) {
        if (e instanceof Error) {
          message.reply(e.message);
        }
      }
    });
    this.logger.debug('Subscribe on message complete');
  };

  private subscribeOnInteract() {
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;

      const interactionCommandSelector = new InteractionCommandSelector();
      await interactionCommandSelector.start(interaction);
    });
    this.logger.debug('Subscribe on interact complete');
  }

  private async registerSlashCommands() {
    try {
      const rest = new REST().setToken(config.token);
      const commandsJson = slashCommands.map((el) => el.builder.toJSON());

      this.logger.info(`Started refreshing ${slashCommands.length} application (/) commands.`);

      // The put method is used to fully refresh all commands in the guild with the current set
      const data = (await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
        body: commandsJson,
      })) as any[];

      this.logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
      console.error(error);
    }
  }
}

export const botClient = new BotClient();
