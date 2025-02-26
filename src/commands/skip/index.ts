import { Command } from '@commands/command';
import { Player } from '@modules/audioPlayer';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { MessageCreateOptions } from 'discord.js';
import pino from 'pino';

class Skip implements Command {
  private logger: pino.Logger;
  public commandKeys = ['skip', 's'];
  public start = async (server: Server) => {
    this.logger = new Logger('Command-Skip', server.guildId).childLogger;
    if (!server.voiceChannel) {
      this.logger.debug('Not connected to voice channel');
      throw new Error(':x: **Connect to voice channel**');
    }

    if (!server.songs.length) {
      this.logger.debug('Queue empty');
      throw new Error(':x: **Queue empty**');
    }
    const player = new Player(server);
    this.logger.debug('Player found');

    player.skip();
    this.logger.debug('Player skipped');
  };

  public successContent = async (): Promise<MessageCreateOptions> => ({ content: ':handshake:  **Skipped** ' });
}

export const skip = new Skip();
