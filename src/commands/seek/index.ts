import { Command } from '@commands/command';
import { Player } from '@modules/audioPlayer';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { timeToSec } from '@utils/secToTime';
import { MessageEditOptions } from 'discord.js';
import pino from 'pino';

class Seek implements Command {
  commandKeys = ['seek'];
  private logger: pino.Logger;
  private time = '';

  start = async (server: Server, args: string[]) => {
    this.logger = new Logger('Command-Seek', server.guildId).childLogger;
    const timeString = args[0];
    if (!timeString) {
      throw new Error('Time not found');
    }
    const timeSec = timeToSec(timeString);
    this.time = timeString;

    const player = new Player(server);
    await player.init();
    player.seek(timeSec);
    this.logger.debug(`Seeked to ${timeString}`);
  };

  successContent = async (): Promise<MessageEditOptions> => ({
    content: ``,
  });
}

export const seek = new Seek();
