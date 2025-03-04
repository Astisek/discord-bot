import { Command } from '@commands/command';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { MessageEditOptions } from 'discord.js';
import pino from 'pino';

class Autoplay implements Command {
  commandKeys = ['autoplay'];
  private logger: pino.Logger;
  private autoPlay = false;

  start = async (server: Server) => {
    this.logger = new Logger('Command-Autoplay', server.guildId).childLogger;

    server.isAutoplay = !server.isAutoplay;
    this.autoPlay = server.isAutoplay;
    await database.updateServer(server);
    this.logger.debug(this.autoPlay ? 'Autoplay enabled' : 'Autoplay disabled');
  };

  successContent = async (): Promise<MessageEditOptions> => ({
    content: this.autoPlay ? `:musical_note: **Autoplay enabled!**` : ':musical_note: **Autoplay disabled!**',
  });
}

export const autoplay = new Autoplay();
