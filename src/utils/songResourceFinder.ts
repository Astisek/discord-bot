import { createAudioResource, StreamType } from '@discordjs/voice';
import { config } from '@utils/config';
import { Logger } from '@utils/logger';
import { SGError } from '@utils/SGError';
import { youtube } from '@utils/youtube';
import { Readable } from 'stream';

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

  private createResourceFromReadableStream = async (stream: ReadableStream<Uint8Array<ArrayBufferLike>>) => {
    const readableStream = Readable.fromWeb(stream, { highWaterMark: config.chunkSize });

    readableStream.on('error', (e) => this.logger.error(`readableStream ${e.message} ${e.stack}`));

    return createAudioResource(readableStream, { inputType: StreamType.Arbitrary });
  };
}

export const songResourceFinder = new SongResourceFinder();
