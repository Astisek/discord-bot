import { createAudioResource } from '@discordjs/voice';
import { Logger } from '@utils/logger';
import { SGError } from '@utils/SGError';
import { youtube } from '@utils/youtube';
import { PassThrough, Readable } from 'stream';
import { FFmpeg } from 'prism-media';

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
    const transcoder = new FFmpeg({
      args: [
        '-loglevel',
        'error',
        '-analyzeduration',
        '0',
        '-loglevel',
        '0',
        '-f',
        's16le',
        '-ar',
        '48000',
        '-ac',
        '2',
        '-max_reload',
        '10',
        '-timeout',
        '30000000',
      ],
    });
    const readableStream = Readable.fromWeb(stream, {
      highWaterMark: 1,
      objectMode: false,
    });
    readableStream.pipe(transcoder).pipe(
      new PassThrough({
        highWaterMark: (96000 / 8) * 30,
      }),
    );
    readableStream.on('close', () => this.logger.debug('Resource closed'));
    readableStream.on('end', () => this.logger.debug('Resource end'));
    readableStream.on('error', (e) => this.logger.debug(`Resource error ${e.message} ${e.stack}`));

    return createAudioResource(readableStream);
  };
}

export const songResourceFinder = new SongResourceFinder();
