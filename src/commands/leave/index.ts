import { Command } from '@commands/command';
import { getVoiceConnection } from '@discordjs/voice';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { MessageCreateOptions } from 'discord.js';
import pino from 'pino';

class Leave implements Command {
  private logger: pino.Logger;

  public commandKeys = ['leave', 'l'];
  public start = async (server: Server) => {
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

  public successContent = async (): Promise<MessageCreateOptions> => ({
    content: ':jigsaw: Leaving the voice channel. See you next time!',
  });
}

export const leave = new Leave();
