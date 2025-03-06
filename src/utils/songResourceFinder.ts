import { createAudioResource } from '@discordjs/voice';
import { Logger } from '@utils/logger';
import { SGError } from '@utils/SGError';
import { youtube } from '@utils/youtube';
import { PassThrough, Readable } from 'stream';
import { config } from '@utils/config';
import { spawn } from 'child_process';

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
    const ffmpegProcess = spawn('ffmpeg', [
      '-loglevel',
      'error',
      '-f',
      's16le',
      '-ar',
      '48000',
      '-ac',
      '2',
      '-i',
      '-',
      '-c:a',
      'pcm_s16le',
      '-f',
      's16le',
      '-',
    ]);

    // Создаем PassThrough поток
    const passThrough = new PassThrough({
      highWaterMark: config.chunkSize * 1.5,
    });
    const readableStream = Readable.fromWeb(stream, { objectMode: false });

    // Соединяем потоки
    readableStream.pipe(ffmpegProcess.stdin).on('error', (e) => this.logger.debug(`Input pipe error: ${e.message}`));

    ffmpegProcess.stdout.pipe(passThrough).on('error', (e) => this.logger.debug(`Output pipe error: ${e.message}`));

    ffmpegProcess.on('error', (e) => {
      this.logger.debug(`FFmpeg process error: ${e.message}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
      this.logger.debug(`FFmpeg stderr: ${data.toString()}`);
    });

    return createAudioResource(passThrough);
  };
}

export const songResourceFinder = new SongResourceFinder();
