import { Command } from '@commands/command';
import { Player } from '@modules/audioPlayer';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { SGError } from '@utils/SGError';
import { MessageEditOptions, SlashCommandBuilder } from 'discord.js';
import pino from 'pino';

export class Move implements Command {
  static commandKeys = ['move', 'm'];
  static builder = new SlashCommandBuilder()
    .setName('move')
    .setDescription('Soon')
    .addIntegerOption((option) => option.setName('prev').setDescription('Soon').setRequired(true).setMinValue(0))
    .addIntegerOption((option) => option.setName('next').setDescription('Soon').setRequired(true).setMinValue(0));
  private logger: pino.Logger;

  start = async (server: Server, args: string[]) => {
    this.logger = new Logger('Command-Move', server.guildId).childLogger;

    const prevOrdinal = +args[0];
    const newOrdinal = +args[1];

    if (!newOrdinal || !prevOrdinal || prevOrdinal > server.songs.length || newOrdinal > server.songs.length) {
      this.logger.debug(`Invalid ordinals: ${prevOrdinal}, ${newOrdinal} (max: ${server.songs.length})`);
      throw new SGError('Not valid ordinals');
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
