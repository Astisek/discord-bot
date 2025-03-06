import { createAudioResource } from '@discordjs/voice';
import { Logger } from '@utils/logger';
import { SGError } from '@utils/SGError';
import { youtube } from '@utils/youtube';
import internal, { PassThrough } from 'stream';
import { config } from '@utils/config';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

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
    const ffmpegProcess = spawn(ffmpegPath || '', [
      '-reconnect',
      '1',
      '-reconnect_streamed',
      '1',
      '-reconnect_on_network_error',
      '1',
      '-reconnect_on_http_error',
      '4xx,5xx',
      '-reconnect_delay_max',
      '30',
      '-analyzeduration',
      '0',
      '-loglevel',
      'error',
      '-i',
      'pipe:0',
      '-f',
      's16le',
      '-ar',
      '48000',
      '-ac',
      '2',
      'pipe:1',
    ]);
    const inputStream = internal.Readable.fromWeb(stream, { objectMode: false });
    const outputStream = new PassThrough({ highWaterMark: config.chunkSize * 1.5 });

    inputStream.pipe(ffmpegProcess.stdin);
    ffmpegProcess.stdout.pipe(outputStream);

    outputStream.on('error', (e) => this.logger.debug(`Resource error ${e.message} ${e.stack}`));

    return createAudioResource(outputStream);
  };
}

export const songResourceFinder = new SongResourceFinder();
