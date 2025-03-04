import { Command } from '@commands/command';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { MessageEditOptions } from 'discord.js';
import pino from 'pino';

class Clear implements Command {
  commandKeys = ['clear'];
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

export const clear = new Clear();
