import { Command } from '@commands/command';
import { Server } from '@modules/database/entities/Server';
import { Song } from '@modules/database/entities/Song';
import { EmbedGenerator } from '@utils/embedGenerator';
import { Logger } from '@utils/logger';
import { secToTime } from '@utils/secToTime';
import { SGError } from '@utils/SGError';
import { MessageEditOptions, SlashCommandBuilder } from 'discord.js';
import pino from 'pino';

export class Queue implements Command {
  static commandKeys = ['queue', 'q'];
  static builder = new SlashCommandBuilder().setName('queue').setDescription('Soon');

  private logger: pino.Logger;
  private queue: Song[];
  private isAutoPlay = false;

  start = async (server: Server) => {
    this.logger = new Logger('Command-Queue', server.guildId).childLogger;

    if (!server.songs.length) {
      this.logger.debug('Queue empty');
      throw new SGError('Queue empty');
    }

    this.queue = server.songs;
    this.isAutoPlay = server.isAutoplay;
    this.logger.debug('Queue found');
  };
  successContent = async (): Promise<MessageEditOptions> => {
    const embed = new EmbedGenerator();
    const fields = this.queue.map(({ title, duration }, index) => ({
      name: `${index + 1}. ${title}`,
      value: `duration: ${secToTime(duration)}`,
      inline: false,
    }));
    embed.setStyles((builder) => builder.setTitle(this.isAutoPlay ? `Queue (AutoPlay)` : 'Queue').addFields(fields));

    return {
      embeds: [embed.embed],
    };
  };
}
