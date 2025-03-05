import { createAudioResource, demuxProbe } from '@discordjs/voice';
import { SGError } from '@utils/SGError';
import { youtube } from '@utils/youtube';
import internal from 'stream';

// TODO: В utils
class SongResourceFinder {
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
    const readableStream = internal.Readable.fromWeb(stream, { highWaterMark: 1024 * 1024 * 5, objectMode: false });

    const { stream: resourceStream, type } = await demuxProbe(readableStream);

    return createAudioResource(resourceStream, { inputType: type, silencePaddingFrames: 10 });
  };
}

export const songResourceFinder = new SongResourceFinder();
