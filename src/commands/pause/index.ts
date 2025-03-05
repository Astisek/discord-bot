import { Command } from '@commands/command';
import { Player } from '@modules/audioPlayer';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { MessageEditOptions, SlashCommandBuilder } from 'discord.js';
import pino from 'pino';

export class Pause implements Command {
  static commandKeys = ['pause'];
  static builder = new SlashCommandBuilder().setName('pause').setDescription('Soon');
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
