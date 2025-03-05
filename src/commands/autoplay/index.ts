import { Command } from '@commands/command';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { MessageEditOptions, SlashCommandBuilder } from 'discord.js';
import pino from 'pino';

export class Autoplay implements Command {
  static commandKeys = ['autoplay'];
  static builder = new SlashCommandBuilder().setName('autoplay').setDescription('Soon');
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
