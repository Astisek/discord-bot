import { Command } from '@commands/command';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { MessageEditOptions } from 'discord.js';
import pino from 'pino';

class Prefix implements Command {
  commandKeys = ['prefix'];
  private logger: pino.Logger;

  private newPrefix = '';

  start = async (server: Server, args: string[]) => {
    this.logger = new Logger('Command-Prefix', server.guildId).childLogger;
    this.newPrefix = args[0];

    if (!this.newPrefix) {
      this.logger.debug('New prefix not found');
      throw new Error('Argument not found');
    }

    server.prefix = this.newPrefix;
    await database.updateServer(server);
    this.logger.debug(`Prefix changed to ${this.newPrefix}`);
  };

  successContent = async (): Promise<MessageEditOptions> => ({
    content: `Prefix changed to **${this.newPrefix}**`,
  });
}

export const prefix = new Prefix();
