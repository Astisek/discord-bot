import { createAudioResource } from '@discordjs/voice';
import { config } from '@utils/config';
import { Logger } from '@utils/logger';
import { SGError } from '@utils/SGError';
import { youtube } from '@utils/youtube';
import { spawn } from 'child_process';
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
      '-ignore_errors',
      '-thread_queue_size',
      '1024',
      '-max_reload',
      '10',
      '-timeout',
      '30000000',
      '-f',
      's16le',
      '-',
    ]);

    const safeStream = new PassThrough({
      highWaterMark: config.chunkSize,
      allowHalfOpen: true,
    });

    const readableStream = Readable.fromWeb(stream, { objectMode: false });

    readableStream
      .on('data', (data) => {
        // Принудительное возобновление если процесс отстает
        if (!ffmpegProcess.stdin.write(data)) {
          readableStream.pause();
          ffmpegProcess.stdin.once('drain', () => readableStream.resume());
        }
      })
      .on('end', () => this.logger.debug('Input stream ended'))
      .on('error', (e) => {
        this.logger.error(`Input error: ${e.message}`);
        ffmpegProcess.kill('SIGTERM');
      });

    // Обработчики для FFmpeg процесса
    ffmpegProcess.stdin.on('error', (e) => {
      // @ts-ignore
      if (e.code !== 'EPIPE') this.logger.error(`FFmpeg stdin error: ${e}`);
    });

    ffmpegProcess.stdout
      .on('data', (data) => safeStream.write(data))
      .on('end', () => safeStream.end())
      .on('error', (e) => safeStream.destroy(e));

    ffmpegProcess.on('exit', (code, signal) => {
      this.logger.debug(`FFmpeg exited (${code}, ${signal})`);
      safeStream.end();
    });

    // Механизм heartbeat для детектирования "зависаний"
    let lastData = Date.now();
    safeStream.on('data', () => (lastData = Date.now()));

    const heartbeat = setInterval(() => {
      if (Date.now() - lastData > 30000) {
        this.logger.error('No data for 30s, restarting');
        ffmpegProcess.kill('SIGKILL');
        clearInterval(heartbeat);
      }
    }, 5000);

    return createAudioResource(safeStream);
  };
}

export const songResourceFinder = new SongResourceFinder();
