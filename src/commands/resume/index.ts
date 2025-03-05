import { Command } from '@commands/command';
import { Player } from '@modules/audioPlayer';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { MessageEditOptions, SlashCommandBuilder } from 'discord.js';
import pino from 'pino';

export class Resume implements Command {
  static commandKeys = ['resume'];
  static builder = new SlashCommandBuilder().setName('resume').setDescription('Soon');

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
