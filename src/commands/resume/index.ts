import { Command } from '@commands/command';
import { Player } from '@modules/audioPlayer';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { MessageEditOptions } from 'discord.js';
import pino from 'pino';

class Resume implements Command {
  commandKeys = ['resume'];
  private logger: pino.Logger;

  start = async (server: Server) => {
    this.logger = new Logger('Command-Resume', server.guildId).childLogger;
    const player = new Player(server);
    await player.init();
    player.resume();
    this.logger.debug('Resumed');
  };
  successContent = async (): Promise<MessageEditOptions> => ({
    content: `:watermelon:  **Resumed!**`,
  });
}

export const resume = new Resume();
