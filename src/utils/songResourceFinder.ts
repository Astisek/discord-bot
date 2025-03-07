import { createAudioResource, demuxProbe } from '@discordjs/voice';
import { config } from '@utils/config';
import { Logger } from '@utils/logger';
import { SGError } from '@utils/SGError';
import { youtube } from '@utils/youtube';
import { PassThrough, Readable } from 'stream';

class SongResourceFinder {
  private logger = new Logger('SongResourceFinder').childLogger;

  youTube = async (url: string) => {
    const videoId = youtube.getVideoId(url);
    const stream = await youtube.getStream(videoId);

    return await this.createResourceFromReadableStream(stream);
  };

  custom = async (url: string) => {
    const response = await fetch(url);
    const stream = response?.body;
    if (!response.ok || !stream) throw new SGError(`Failed load audio: ${response.statusText}`);

    return await this.createResourceFromReadableStream(stream);
  };

  private createResourceFromReadableStream = async (stream: ReadableStream) => {
    const readableStream = Readable.fromWeb(stream, { highWaterMark: config.chunkSize * 0.5 });
    const passThrough = new PassThrough({
      highWaterMark: config.chunkSize * 0.5,
      allowHalfOpen: true,
      autoDestroy: false,
      decodeStrings: false,
    });

    const passThroughStream = readableStream.pipe(passThrough);

    passThrough.on('error', (e) => this.logger.error(`passThrough ${e.message} ${e.stack}`));
    readableStream.on('error', (e) => this.logger.error(`readableStream ${e.message} ${e.stack}`));

    const { stream: discordStream, type } = await demuxProbe(passThroughStream);

    return createAudioResource(discordStream, { inputType: type });
  };
}

export const songResourceFinder = new SongResourceFinder();
