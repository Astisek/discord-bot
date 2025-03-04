import { Command } from '@commands/command';
import { getVoiceConnection } from '@discordjs/voice';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { MessageEditOptions } from 'discord.js';
import pino from 'pino';

class Leave implements Command {
  private logger: pino.Logger;

  commandKeys = ['leave', 'l'];

  start = async (server: Server) => {
    this.logger = new Logger('Leave', server.guildId).childLogger;

    const connection = getVoiceConnection(server.guildId);
    this.logger.debug(`Voice connection found!`);

    connection?.destroy();
    this.logger.debug(`Voice connection destroyed!`);

    server.textChannel = null;
    server.voiceChannel = null;
    await database.updateServer(server);
    this.logger.debug(`Channels resets`);
  };

  successContent = async (): Promise<MessageEditOptions> => ({
    content: ':jigsaw: Leaving the voice channel. See you next time!',
  });
}

export const leave = new Leave();
