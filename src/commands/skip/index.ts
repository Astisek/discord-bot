import { Command } from '@commands/command';
import { Player } from '@modules/audioPlayer';
import { Server } from '@modules/database/entities/Server';
import { Song } from '@modules/database/entities/Song';
import { Logger } from '@utils/logger';
import { MessageEditOptions } from 'discord.js';
import pino from 'pino';

class Skip implements Command {
  commandKeys = ['skip', 's'];
  private logger: pino.Logger;
  private skippedSong: Song;

  start = async (server: Server) => {
    this.logger = new Logger('Command-Skip', server.guildId).childLogger;
    if (!server.voiceChannel) {
      this.logger.debug('Not connected to voice channel');
      throw new Error(':x: **Connect to voice channel**');
    }

    if (!server.songs.length) {
      this.logger.debug('Queue empty');
      throw new Error(':x: **Queue empty**');
    }
    this.skippedSong = server.songs[0];

    const player = new Player(server);
    await player.init();
    this.logger.debug('Player found');

    player.skip();
    this.logger.debug('Player skipped');
  };

  successContent = async (): Promise<MessageEditOptions> => ({
    content: `:handshake:  **Skipped** ${this.skippedSong?.title}`,
  });
}

export const skip = new Skip();
