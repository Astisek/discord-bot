import {
  AudioPlayer,
  AudioPlayerPlayingState,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  getVoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { botClient } from '@modules/botClient';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Song } from '@modules/database/entities/Song';
import { SongTypeEnum } from '@modules/database/interfaces/songs';
import { songResourceFinder } from '@modules/songResourceFinder';
import { autoPlayUtils } from '@utils/autoPlayUtils';
import { Logger } from '@utils/logger';

export class Player {
  private logger = new Logger('Player', this.server.guildId).childLogger;
  private static players = new Map<string, AudioPlayer>();

  private player: AudioPlayer;

  constructor(private server: Server) {}

  init = async () => {
    const player = this.getPlayer();
    if (!player) {
      this.player = await this.createPlayer();
      this.logger.debug(`Audio player not found but created!`);
    } else {
      this.player = player;
      this.logger.debug(`Audio player found!`);
    }
  };

  get isPlaying() {
    return this.player.state.status !== AudioPlayerStatus.Idle;
  }
  get playbackSecDuration() {
    const state = this.player.state as AudioPlayerPlayingState;
    if (!state.resource) return 0;

    return Math.floor(state.resource.playbackDuration / 1000);
  }

  start = async () => {
    const server = await database.findServer(this.server.guildId);
    this.subscribeOnIdle();
    await this.playSong(server.songs[0]);
    this.logger.debug(`Audio player started`);
  };

  skip = () => {
    this.player.pause(true);
    this.player.stop();
    this.player.unpause();
    this.logger.debug('Skipped');
  };

  pause = () => {
    this.player.pause();
  };

  resume = () => {
    this.player.unpause();
  };

  seek = (seek: number) => {
    const state = this.player.state as AudioPlayerPlayingState;
    state.playbackDuration = seek;
  };

  private playSong = async (song: Song) => {
    try {
      const resource = await this.createResource(song);
      this.logger.debug('Resource found!');

      this.play(resource);
    } catch (_) {
      this.startNextTrack();
    }
  };

  private createResource = async (song: Song) => {
    switch (song.songType) {
      case SongTypeEnum.Custom:
        this.logger.debug(`Searching custom resource ${song.url}`);
        return await songResourceFinder.custom(song.url);
      case SongTypeEnum.Youtube:
      default:
        this.logger.debug(`Searching youtube resource ${song.url}`);
        return await songResourceFinder.youTube(song.url);
    }
  };

  private startNextTrack = async () => {
    try {
      const voiceConnection = getVoiceConnection(this.server.guildId);
      if (!voiceConnection) {
        throw new Error('Voice connection not found');
      }
      entersState(voiceConnection, VoiceConnectionStatus.Ready, 30e3);
      const server = await database.findServer(this.server.guildId);
      const lastSong = server.songs?.[0];
      const nextSong = server.songs?.[1];
      if (lastSong) {
        await database.removeSong(lastSong.id, server.guildId);
      }
      if (nextSong) {
        return this.playSong(nextSong);
      }

      if (server.isAutoplay) {
        const autoPlaySong = await autoPlayUtils.createSongFromUrl(lastSong.url, server);
        this.logger.debug('Autoplay song found');
        const dbAutoPlaySong = await database.addSong(server.guildId, autoPlaySong);
        await database.addAutoplayBuffer(server.guildId, dbAutoPlaySong.url);
        this.logger.debug('Autoplay song starting...');
        return await this.playSong(dbAutoPlaySong);
      }

      this.destroy();
    } catch (e) {
      if (e instanceof Error) {
        if (!this.server.textChannel) return;
        const channel = await botClient.getTextChannel(this.server.textChannel);
        await channel.send(e.message);
        await this.startNextTrack();
      }
    }
  };

  private subscribeOnIdle = () => {
    this.player.removeAllListeners();
    this.player.on('debug', (text) => this.logger.debug(text));
    this.player.on('error', (error) => {
      this.logger.error(error, 'Error audio player');
    });
    this.player.on(AudioPlayerStatus.Idle, this.startNextTrack);
    this.logger.debug(`Subscribe on idle complete`);
  };

  private play = (resource: AudioResource) => {
    this.player.play(resource);
    this.logger.debug(`Started resource on`);
  };

  private getPlayer = () => Player.players.get(this.server.guildId);

  private createPlayer = async () => {
    const voiceConnection = getVoiceConnection(this.server.guildId);
    if (!voiceConnection) {
      throw new Error('Voice connection not found');
    }
    const audioPlayer = createAudioPlayer();
    Player.players.set(this.server.guildId, audioPlayer);
    await entersState(voiceConnection, VoiceConnectionStatus.Ready, 30e3);
    voiceConnection.subscribe(audioPlayer);
    voiceConnection.configureNetworking();
    this.logger.debug(`Audio player created`);
    return audioPlayer;
  };

  private destroy = () => {
    this.player.removeAllListeners();
    Player.players.delete(this.server.guildId);
    this.logger.debug(`Player destroyed`);
  };
}
