import { config } from '@utils/config';
import Innertube from 'youtubei.js';

class Youtube {
  private innertube: Innertube;
  initialize = async () => {
    this.innertube = await Innertube.create({
      cookie: config.youtubeCookie,
    });
  };

  get yt() {
    return this.innertube;
  }

  getStream = (url: string) => this.innertube.download(url);

  getFullUrl = (url: string) => {
    if (url.startsWith('https://www.youtube.com/shorts/')) {
      return `https://www.youtube.com/watch?v=${url.replace('https://www.youtube.com/shorts/', '')}`;
    }
    if (url.startsWith('https://youtu.be/')) {
      return `https://www.youtube.com/watch?v=${url.replace('https://youtu.be/', '')}`;
    }
    return url;
  };

  getYoutubeUrlFromId = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;

  getVideoId = (url: string) => {
    const fullUrl = this.getFullUrl(url);
    const searchParams = this.urlParams(fullUrl);
    return searchParams.get('v') || '';
  };

  getPlaylistId = (url: string) => {
    const fullUrl = this.getFullUrl(url);
    const searchParams = this.urlParams(fullUrl);
    return searchParams.get('list') || '';
  };

  private urlParams = (url: string) => {
    const [, search] = url.split('?');
    const searchParams = new URLSearchParams(search);
    return searchParams;
  };
}

export const youtube = new Youtube();
