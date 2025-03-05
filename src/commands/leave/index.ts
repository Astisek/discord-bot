import { Command } from '@commands/command';
import { getVoiceConnection } from '@discordjs/voice';
import { Player } from '@modules/audioPlayer';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { MessageEditOptions, SlashCommandBuilder } from 'discord.js';
import pino from 'pino';

export class Leave implements Command {
  static commandKeys = ['leave', 'l'];
  static builder = new SlashCommandBuilder().setName('leave').setDescription('Soon');
  private logger: pino.Logger;

  start = async (server: Server) => {
    this.logger = new Logger('Leave', server.guildId).childLogger;

    const connection = getVoiceConnection(server.guildId);
    const player = new Player(server);
    await player.init();
    player.destroy();
    this.logger.debug(`Voice connection found`);

    connection?.destroy();
    this.logger.debug(`Voice connection destroyed`);

    server.textChannel = null;
    server.voiceChannel = null;
    await database.updateServer(server);
    this.logger.debug(`Channels resets`);
  };

  successContent = async (): Promise<MessageEditOptions> => ({
    content: ':jigsaw: Leaving the voice channel. See you next time!',
  });
}
