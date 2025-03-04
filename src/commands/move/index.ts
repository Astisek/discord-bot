import { Command } from '@commands/command';
import { Player } from '@modules/audioPlayer';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { MessageEditOptions } from 'discord.js';
import pino from 'pino';

class Move implements Command {
  commandKeys = ['move', 'm'];
  private logger: pino.Logger;

  start = async (server: Server, args: string[]) => {
    this.logger = new Logger('Command-Move', server.guildId).childLogger;

    const prevOrdinal = +args[0];
    const newOrdinal = +args[1];

    if (!newOrdinal || !prevOrdinal || prevOrdinal > server.songs.length || newOrdinal > server.songs.length) {
      this.logger.debug(`Invalid ordinals: ${prevOrdinal}, ${newOrdinal} (max: ${server.songs.length})`);
      throw new Error('Not valid ordinals');
    }

    await database.moveSong(server.guildId, prevOrdinal, newOrdinal);
    this.logger.debug('Moving complete');
    if (newOrdinal === 1) {
      const player = new Player(server);
      await player.init();
      await player.start();
    }
  };
  successContent = async (): Promise<MessageEditOptions> => ({
    content: ':pie:  **Track moved!**',
  });
}

export const move = new Move();
