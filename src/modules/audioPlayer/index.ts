import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  getVoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Song } from '@modules/database/entities/Song';
import { SongTypeEnum } from '@modules/database/interfaces/songs';
import { songResourceFinder } from '@modules/songResourceFinder';
import { Logger } from '@utils/logger';

export class Player {
  private logger = new Logger('Player', this.server.guildId).childLogger;
  private static players = new Map<string, AudioPlayer>();

  private player: AudioPlayer;

  constructor(private server: Server) {
    const player = this.getPlayer();
    if (!player) {
      this.player = this.createPlayer();
      this.logger.debug(`Audio player not found but created!`);
    } else {
      this.player = player;
      this.logger.debug(`Audio player found!`);
    }
  }

  get isPlaying() {
    return this.player.state.status !== AudioPlayerStatus.Idle;
  }

  start = async () => {
    const server = await database.findServer(this.server.guildId);
    this.playSong(server.songs[0]);
    this.subscribeOnIdle();
    this.logger.debug(`Audio player started`);
  };

  skip() {
    this.player.pause(true);
    this.player.stop();
    this.player.unpause();
    this.logger.debug('Skipped');
  }

  private playSong = async (song: Song) => {
    switch (song.songType) {
      case SongTypeEnum.Youtube:
      default:
        this.play(await songResourceFinder.youTube(song.video_id));
        this.logger.debug(`Started track on youtube ${song.video_id}`);
        break;
    }
  };
  private subscribeOnIdle = () => {
    this.player.removeAllListeners();
    this.player.on('debug', (text) => this.logger.debug(text));
    this.player.on('error', (error) => {
      this.logger.error(error, 'Error audio player');
    });
    this.player.on(AudioPlayerStatus.Idle, async () => {
      // TODO: В метод повторяется
      const voiceConnection = getVoiceConnection(this.server.guildId);
      if (!voiceConnection) {
        throw new Error('Voice connection not found');
      }
      entersState(voiceConnection, VoiceConnectionStatus.Ready, 30e3);
      const server = await database.findServer(this.server.guildId);
      const lastSong = server.songs?.[0];
      const nextSong = server.songs?.[1];
      if (lastSong) {
        await database.removeSong(lastSong.id);
      }
      if (nextSong) {
        this.playSong(nextSong);
      } else {
        this.destroy();
      }
    });
    this.logger.debug(`Subscribe on idle complete`);
  };

  private play = (resource: AudioResource) => {
    this.player.play(resource);
    this.logger.debug(`Started resource on`);
  };

  private getPlayer = () => Player.players.get(this.server.guildId);

  private createPlayer = () => {
    const audioPlayer = createAudioPlayer();
    Player.players.set(this.server.guildId, audioPlayer);
    const voiceConnection = getVoiceConnection(this.server.guildId);
    if (!voiceConnection) {
      throw new Error('Voice connection not found');
    }
    entersState(voiceConnection, VoiceConnectionStatus.Ready, 30e3);
    voiceConnection?.subscribe(audioPlayer);
    this.logger.debug(`Audio player created by`);
    return audioPlayer;
  };

  private destroy = () => {
    this.player.removeAllListeners();
    Player.players.delete(this.server.guildId);
    this.logger.debug(`Player destroyed`);
  };
}
