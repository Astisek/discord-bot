import { Command } from '@commands/command';
import { Server } from '@modules/database/entities/Server';
import { Song } from '@modules/database/entities/Song';
import { EmbedGenerator } from '@utils/embedGenerator';
import { Logger } from '@utils/logger';
import { secToTime } from '@utils/secToTime';
import { MessageEditOptions } from 'discord.js';
import pino from 'pino';

class Queue implements Command {
  commandKeys = ['queue', 'q'];
  private logger: pino.Logger;
  private queue: Song[];

  start = async (server: Server) => {
    this.logger = new Logger('Command-Queue', server.guildId).childLogger;

    if (!server.songs.length) {
      this.logger.debug('Queue empty');
      throw new Error('Queue empty');
    }

    this.queue = server.songs;
    this.logger.debug('Queue found');
  };
  successContent = async (): Promise<MessageEditOptions> => {
    const embed = new EmbedGenerator();
    const fields = this.queue.map(({ title, duration }, index) => ({
      name: `${index + 1}. ${title}`,
      value: `duration: ${secToTime(duration)}`,
      inline: false,
    }));
    embed.setStyles((builder) => builder.setTitle('Queue').addFields(fields));

    return {
      embeds: [embed.embed],
    };
  };
}

export const queue = new Queue();
