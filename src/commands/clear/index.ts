import { Command } from '@commands/command';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { MessageEditOptions, SlashCommandBuilder } from 'discord.js';
import pino from 'pino';

export class Clear implements Command {
  static commandKeys = ['clear'];
  static builder = new SlashCommandBuilder().setName('clear').setDescription('Soon');
  private logger: pino.Logger;

  start = async (server: Server) => {
    this.logger = new Logger('Command-Clear', server.guildId).childLogger;

    await database.clearSongs(server);

    this.logger.debug('Queue cleared');
  };

  successContent = async (): Promise<MessageEditOptions> => ({
    content: `:basketball:  **Queue is cleaned**`,
  });
}
