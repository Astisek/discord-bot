import { Command } from '@commands/command';
import { Player } from '@modules/audioPlayer';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { MessageEditOptions } from 'discord.js';
import pino from 'pino';

class Pause implements Command {
  commandKeys = ['pause'];
  private logger: pino.Logger;

  start = async (server: Server) => {
    this.logger = new Logger('Command-Pause', server.guildId).childLogger;
    const player = new Player(server);
    await player.init();
    player.pause();
    this.logger.debug('Paused');
  };

  successContent = async (): Promise<MessageEditOptions> => ({
    content: `:watermelon:  **Paused!**`,
  });
}

export const pause = new Pause();
