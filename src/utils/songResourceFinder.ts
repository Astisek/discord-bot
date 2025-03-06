import { createAudioResource } from '@discordjs/voice';
import { Logger } from '@utils/logger';
import { SGError } from '@utils/SGError';
import { youtube } from '@utils/youtube';
import internal from 'stream';
import prism from 'prism-media';

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
    const transcoder = new prism.FFmpeg({
      args: [
        '-reconnect',
        '1',
        '-reconnect_streamed',
        '1',
        '-reconnect_at_eof',
        '1',
        '-reconnect_delay_max',
        '10',
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
      ],
    });
    const readableStream = internal.Readable.fromWeb(stream, {
      highWaterMark: 1,
      objectMode: false,
    });
    readableStream.pipe(transcoder);
    readableStream.on('close', () => this.logger.debug('Resource closed'));
    readableStream.on('end', () => this.logger.debug('Resource end'));
    readableStream.on('error', (e) => this.logger.debug(`Resource error ${e.message}`));

    return createAudioResource(readableStream);
  };
}

export const songResourceFinder = new SongResourceFinder();
