import { Command } from '@commands/command';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { SGError } from '@utils/SGError';
import { MessageEditOptions, SlashCommandBuilder } from 'discord.js';
import pino from 'pino';

export class Prefix implements Command {
  static commandKeys = ['prefix'];
  static builder = new SlashCommandBuilder()
    .setName('prefix')
    .setDescription('Soon')
    .addStringOption((option) => option.setName('prefix').setDescription('New prefix').setRequired(true));
  private logger: pino.Logger;

  private newPrefix = '';

  start = async (server: Server, args: string[]) => {
    this.logger = new Logger('Command-Prefix', server.guildId).childLogger;
    this.newPrefix = args[0];

    if (!this.newPrefix) {
      this.logger.debug('New prefix not found');
      throw new SGError('Argument not found');
    }

    server.prefix = this.newPrefix;
    await database.updateServer(server);
    this.logger.debug(`Prefix changed to ${this.newPrefix}`);
  };

  successContent = async (): Promise<MessageEditOptions> => ({
    content: `Prefix changed to **${this.newPrefix}**`,
  });
}
