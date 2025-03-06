import { botClient } from '@modules/botClient';
import { Server } from '@modules/database/entities/Server';
import { secToTime } from '@utils/secToTime';
import { SGError } from '@utils/SGError';
import { EmbedBuilder } from 'discord.js';
import { Playlist } from 'youtubei.js/dist/src/parser/youtube';

export class EmbedGenerator {
  private readonly defaultColor = '#36271f';
  private embedBuilder = new EmbedBuilder();

  constructor() {
    this.setDefaultStyles();
  }

  get embed() {
    return this.embedBuilder;
  }

  setStyles = (callback: (embedBuilder: EmbedBuilder) => void) => {
    callback(this.embedBuilder);
  };

  setYoutubePlay = (server: Server, playbackSecDuration: number, isAutoPlay: boolean) => {
    const lastSong = server.songs.pop();
    const firstSong = server.songs.shift();

    if (!lastSong) {
      throw new SGError('Tracks not found');
    }

    const startThrough =
      server.songs.reduce((result, song) => result + +song.duration, 0) +
      ((firstSong?.duration || 0) - playbackSecDuration);

    const title = isAutoPlay ? `${lastSong.title} (Autoplay)` : lastSong.title || 'Empty';
    const color = isAutoPlay ? '#FFFF00' : '#ed0000';

    this.setStyles((builder) =>
      builder
        .setTitle(title)
        .setURL(lastSong.url)
        .setDescription(`From Youtube\nAuthor: ${lastSong.author}`)
        .setThumbnail(lastSong.thumbnailUrl || '')
        .setColor(color)
        .addFields({
          name: `Duration: ${secToTime(+lastSong.duration)}`,
          value: startThrough && !isAutoPlay ? `Starts at ${secToTime(startThrough)}` : 'Starts now',
          inline: false,
        }),
    );
  };
  setYoutubeList = (playlist: Playlist) => {
    this.setStyles((builder) =>
      builder
        .setTitle(`Added to queue ${playlist.info.title}`)
        .setDescription(`Playlist: ${playlist.videos.length} items`)
        .setThumbnail(playlist.info.thumbnails[0].url)
        .setColor('#32b0e2'),
    );
  };
  setCustom = (server: Server) => {
    const lastSong = server.songs.pop();

    if (!lastSong) {
      throw new SGError('Last track not found');
    }

    this.setStyles((builder) =>
      builder
        .setTitle(lastSong.title || 'Empty')
        .setURL(lastSong.url)
        .setDescription(`Custom added \nAuthor: ${lastSong.author}`)
        .setColor('#FFFFFF'),
    );
  };

  private setDefaultStyles() {
    this.embedBuilder
      .setAuthor({
        name: botClient.user?.displayName || '',
        iconURL: botClient.user?.avatarURL() || '',
      })
      .setFooter({
        text: botClient.user?.displayName || '',
      })
      .setColor(this.defaultColor)
      .setTimestamp();
  }
}
