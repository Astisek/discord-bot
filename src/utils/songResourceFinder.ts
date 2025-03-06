import { createAudioResource } from '@discordjs/voice';
import { Logger } from '@utils/logger';
import { SGError } from '@utils/SGError';
import { youtube } from '@utils/youtube';
import internal from 'stream';

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
    const readableStream = internal.Readable.fromWeb(stream, {
      highWaterMark: 1,
      objectMode: false,
    });
    readableStream.on('close', () => this.logger.debug('Resource closed'));
    readableStream.on('end', () => this.logger.debug('Resource end'));
    readableStream.on('error', (e) => this.logger.debug(`Resource error ${e.message}`));
    readableStream.on('pause', () => this.logger.debug('Resource pause'));

    return createAudioResource(readableStream);
  };
}

export const songResourceFinder = new SongResourceFinder();
