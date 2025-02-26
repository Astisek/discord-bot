import { Command } from '@commands/command';
import { join } from '@commands/join';
import { Player } from '@modules/audioPlayer';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { SongTypeEnum } from '@modules/database/interfaces/songs';
import { EmbedGenerator } from '@utils/embedGenerator';
import { Logger } from '@utils/logger';
import { secToTime } from '@utils/secToTime';
import { youtube } from '@utils/youtube';
import { GuildMember, MessageCreateOptions } from 'discord.js';
import pino from 'pino';

class Play implements Command {
  private logger: pino.Logger;
  private successEmbed: EmbedGenerator;

  public commandKeys = ['play', 'p'];
  public start = async (server: Server, args: string[], guildMember: GuildMember) => {
    this.logger = new Logger('Command-Play', server.guildId).childLogger;

    await join.start(server, args, guildMember);
    this.logger.debug(`Joined to voice channel`);

    const player = new Player(server);
    this.logger.debug(`Player found`);

    await this.playYoutubeUrl(server, args, guildMember);
    if (!player.isPlaying) {
      this.logger.debug(`Player not playing starting...`);
      await player.start();
    }
  };

  public successContent = async (): Promise<MessageCreateOptions> => ({
    embeds: [this.successEmbed.embed],
  });

  private playYoutubeUrl = async (server: Server, args: string[], guildMember: GuildMember) => {
    try {
      const videoId = youtube.getVideoId(args[0]);
      const {
        basic_info: { title, duration, thumbnail },
      } = await youtube.yt.getBasicInfo(videoId);

      this.logger.debug(`Youtube metadata found!`);

      await database.addSong(guildMember.guild.id, {
        author: guildMember.displayName || '',
        server,
        songType: SongTypeEnum.Youtube,
        title: title || '',
        video_id: videoId,
        thumbnailUrl: thumbnail?.[0].url,
        duration: duration || 0,
      });
      this.logger.debug(`Song added!`);

      await this.createEmbed(server.guildId);
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error(e.message);
        console.log(JSON.stringify(e));
      }
      throw new Error(`Youtube video: ${args[0]}, not found!`);
    }
  };

  private createEmbed = async (guildId: string) => {
    const server = await database.findServer(guildId);
    const lastSong = server.songs.pop();
    const startThrough = server.songs.reduce((result, song) => result + +song.duration, 0);

    if (!lastSong) {
      this.logger.error('lastSong not found!');
      throw new Error('Tracks not found');
    }

    this.successEmbed = new EmbedGenerator();
    this.successEmbed.setStyles((builder) =>
      builder
        .setTitle(lastSong.title)
        .setURL(youtube.getYoutubeUrlFromId(lastSong.video_id))
        .setDescription(`From Youtube\nAuthor: ${lastSong.author}`)
        .setThumbnail(lastSong.thumbnailUrl || '')
        .addFields({
          name: `Duration: ${secToTime(+lastSong.duration)}`,
          value: startThrough ? `Starts at ${secToTime(startThrough)}` : 'Starts now',
          inline: false,
        }),
    );
  };
}

export const play = new Play();
