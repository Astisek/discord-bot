import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { SongToCreate } from '@modules/database/interfaces/songs';
import { songUtils } from '@utils/songUtils';
import { youtube } from '@utils/youtube';
import { CompactVideo } from 'youtubei.js/dist/src/parser/nodes';

class AutoPlayUtils {
  createSongFromUrl = async (url: string, server: Server): Promise<SongToCreate> => {
    const autoplayUrls = await database.findAutoPlayUrls(server.guildId);
    const videoId = youtube.getVideoId(url);
    const { watch_next_feed } = await youtube.yt.getInfo(videoId);

    if (!watch_next_feed?.length) {
      throw new Error('Watch feed not found');
    }
    const videos = watch_next_feed as unknown as CompactVideo[];

    const video = videos.find((video) => !autoplayUrls.includes(youtube.getFullUrl(video.id)));
    if (!video) {
      throw new Error('Autoplay video not found');
    }
    return songUtils.fromCompactVideo(video, server);
  };
}

export const autoPlayUtils = new AutoPlayUtils();
