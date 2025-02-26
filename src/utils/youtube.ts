import Innertube from 'youtubei.js';
import { InnerTubeConfig } from 'youtubei.js/dist/src/types';

class Youtube {
  private readonly ytConfig: InnerTubeConfig = {
    cookie: `'PREF=f7=4100&tz=Asia.Yekaterinburg&f6=40000000; SOCS=CAISEwgDEgk3MDczMzAwNTkaAnJ1IAEaBgiAi9K7Bg; APISID=GLJzrhCVz4zVga-O/AzDWjnrfbd6DqIunZ; SAPISID=AJ3gdDdF1IlX4EUh/A7hxwpaonnzRPWonQ; __Secure-1PAPISID=AJ3gdDdF1IlX4EUh/A7hxwpaonnzRPWonQ; __Secure-3PAPISID=AJ3gdDdF1IlX4EUh/A7hxwpaonnzRPWonQ; SID=g.a000twh0_O3XEQxQF5JNNNzEBNvIwDofEfbtjE6XZIksoyU3aKafMGr3yFZIxYcqTQi2xwpGfQACgYKARASARUSFQHGX2MiuErmjkqbHXT_4XrMihfsOBoVAUF8yKoysRjkCSMWe5US9AtOcwnm0076; SIDCC=AKEyXzUwj48LSjlPhjKermTJqbPlvbwPZ1XLN6ve7kbO9QmFLs5uksF-KVFxb7bK_rcZmLtUuOI'`,
    location: 'nl',
  };

  private innertube: Innertube;
  initialize = async () => {
    this.innertube = await Innertube.create(this.ytConfig);
  };

  get yt() {
    return this.innertube;
  }

  getStream = (url: string) => this.innertube.download(url);

  getFullUrl(url: string) {
    if (url.startsWith('https://youtu.be/')) {
      return `https://www.youtube.com/watch?v=${url.replace('https://youtu.be/', '')}`;
    }
    return url;
  }

  getYoutubeUrlFromId = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;

  getVideoId = (url: string) => {
    const fullUrl = this.getFullUrl(url);
    const [, search] = fullUrl.split('?');
    const searchParams = new URLSearchParams(search);
    return searchParams.get('v') || '';
  };
}

export const youtube = new Youtube();
