import { Command } from '@commands/command';
import { Player } from '@modules/audioPlayer';
import { Server } from '@modules/database/entities/Server';
import { Song } from '@modules/database/entities/Song';
import { EmbedGenerator } from '@utils/embedGenerator';
import { getPlaybackLine } from '@utils/getPlaybackLine';
import { Logger } from '@utils/logger';
import { secToTime } from '@utils/secToTime';
import { MessageEditOptions } from 'discord.js';
import pino from 'pino';

class NowPlaying implements Command {
  commandKeys = ['nowplaying', 'np'];
  private logger: pino.Logger;
  private currentSong: Song;
  private player: Player;
  private nextSong?: Song;

  start = async (server: Server) => {
    this.logger = new Logger('Command-NowPlaying', server.guildId).childLogger;

    if (!server.songs.length) {
      this.logger.debug('Queue empty');
      throw new Error('Queue empty!');
    }

    this.currentSong = server.songs[0];
    this.nextSong = server.songs?.[1];
    this.player = new Player(server);
    await this.player.init();

    this.logger.debug('Song found');
    if (this.nextSong) {
      this.logger.debug('Next song found');
    }
  };

  successContent = async (): Promise<MessageEditOptions> => {
    const embed = new EmbedGenerator();
    const nextSongTitle = this.nextSong?.title;
    const nextSong = nextSongTitle ? `Next: ${nextSongTitle}` : '';
    const currentPosition = secToTime(this.player.playbackSecDuration);
    const endPosition = secToTime(this.currentSong.duration);

    embed.setStyles((builder) =>
      builder
        .setTitle(this.currentSong.title)
        .setDescription(
          `${currentPosition} ${getPlaybackLine(this.player.playbackSecDuration, this.currentSong.duration)} ${endPosition}\n\n${nextSong}`,
        ),
    );

    return {
      embeds: [embed.embed],
    };
  };
}

export const nowPlaying = new NowPlaying();
