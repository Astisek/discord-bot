import { Server } from '@modules/database/entities/Server';
import { SongToCreate, SongTypeEnum } from '@modules/database/interfaces/songs';
import { youtube } from '@utils/youtube';
import { Attachment, GuildMember } from 'discord.js';
import { CompactVideo, PlaylistVideo } from 'youtubei.js/dist/src/parser/nodes';
import { VideoInfo } from 'youtubei.js/dist/src/parser/youtube';

class SongUtils {
  formBasicInfo = (
    { title, id, thumbnail, duration }: VideoInfo['basic_info'],
    server: Server,
    author?: GuildMember,
  ): SongToCreate => ({
    author: author?.displayName || 'Bot',
    server,
    songType: SongTypeEnum.Youtube,
    title: title || '',
    url: youtube.getYoutubeUrlFromId(id || ''),
    thumbnailUrl: thumbnail?.[0].url,
    duration: duration || 0,
  });

  fromPlaylistVideos = (playlistVideos: PlaylistVideo[], server: Server, author: GuildMember): SongToCreate[] =>
    playlistVideos.map(({ title, id, thumbnails, duration }) => ({
      author: author.displayName || '',
      server,
      songType: SongTypeEnum.Youtube,
      title: title.text || '',
      url: youtube.getYoutubeUrlFromId(id) || '',
      thumbnailUrl: thumbnails?.[0].url,
      duration: duration.seconds || 0,
    }));

  fromAttachment = (attachment: Attachment, server: Server, author: GuildMember): SongToCreate => ({
    author: author.displayName || '',
    server,
    songType: SongTypeEnum.Custom,
    title: attachment.title || '',
    url: attachment.url || '',
    duration: 0,
  });

  fromCompactVideo = (video: CompactVideo, server: Server): SongToCreate => ({
    author: 'Bot',
    server,
    songType: SongTypeEnum.Youtube,
    title: video.title.text || '',
    thumbnailUrl: video.thumbnails[0].url,
    url: youtube.getYoutubeUrlFromId(video.id) || '',
    duration: video.duration.seconds || 0,
  });
}

export const songUtils = new SongUtils();
