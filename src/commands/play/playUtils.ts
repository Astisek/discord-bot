import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { SGError } from '@utils/SGError';
import { songUtils } from '@utils/songUtils';
import { youtube } from '@utils/youtube';
import { Attachment, GuildMember } from 'discord.js';
import { PlaylistVideo } from 'youtubei.js/dist/src/parser/nodes';

class PlayUtils {
  playCustom = async (attachment: Attachment, server: Server, guildMember: GuildMember) => {
    if (!attachment) {
      throw new SGError('Attachment not found');
    }
    const song = songUtils.fromAttachment(attachment, server, guildMember);

    await database.addSong(server.guildId, song);
  };

  playYoutubeSingleUrl = async (argumentUrl: string, server: Server, guildMember: GuildMember) => {
    const logger = new Logger('Command-Play', server.guildId).childLogger;
    try {
      const videoId = youtube.getVideoId(argumentUrl);
      const { basic_info } = await youtube.yt.getBasicInfo(videoId);

      logger.debug(`Youtube metadata found`);

      const song = songUtils.formBasicInfo(basic_info, server, guildMember);

      await database.addSong(server.guildId, song);
      logger.debug(`single songs added`);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e.message);
      }
      throw new SGError(`Youtube video: ${argumentUrl}, not found!`);
    }
  };

  playYoutubePlaylistUrl = async (argumentUrl: string, server: Server, guildMember: GuildMember) => {
    const logger = new Logger('Command-Play', server.guildId).childLogger;
    try {
      const playlistId = youtube.getPlaylistId(argumentUrl);
      const playlist = await youtube.yt.getPlaylist(playlistId);
      const videos = playlist.videos as PlaylistVideo[];

      logger.debug(`Youtube metadata found`);

      const songs = songUtils.fromPlaylistVideos(videos, server, guildMember);

      await Promise.all(songs.map((song) => database.addSong(server.guildId, song)));
      logger.debug(`${songs.length} songs added!`);

      return playlist;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e.message);
      }
      throw new SGError(`Playlist: ${argumentUrl}, not found!`);
    }
  };
}

export const playUtils = new PlayUtils();
