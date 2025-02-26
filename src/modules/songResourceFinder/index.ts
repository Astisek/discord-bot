import { createAudioResource, demuxProbe } from '@discordjs/voice';
import { youtube } from '@utils/youtube';
import internal from 'stream';

class SongResourceFinder {
  youTube = async (videoId: string) => {
    const stream = await youtube.getStream(videoId);

    const readableStream = internal.Readable.fromWeb(stream, { highWaterMark: 16793600, objectMode: false });

    const { stream: resourceStream, type } = await demuxProbe(readableStream);

    return createAudioResource(resourceStream, { inputType: type, silencePaddingFrames: 10 });
  };
}

export const songResourceFinder = new SongResourceFinder();
