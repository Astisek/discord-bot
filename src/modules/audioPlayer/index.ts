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
import { autoDisconnectControl } from '@modules/autoDisconnectControl';
import { botClient } from '@modules/botClient';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Song } from '@modules/database/entities/Song';
import { SongTypeEnum } from '@modules/database/interfaces/songs';
import { songResourceFinder } from '@utils/songResourceFinder';
import { autoPlayUtils } from '@utils/autoPlayUtils';
import { EmbedGenerator } from '@utils/embedGenerator';
import { Logger } from '@utils/logger';
import { SGError } from '@utils/SGError';
import { Leave } from '@commands/leave';

export class Player {
  private logger = new Logger('Player', this.server.guildId).childLogger;
  private static players = new Map<string, AudioPlayer>();
  private readonly autoDisconnectTimeout = 5000; // 5sec

  constructor(private server: Server) {}

  init = async (force?: boolean) => {
    const player = this.getPlayer();
    if (!player || force) {
      await this.createPlayer();
      this.logger.debug(`Audio player not found but created`);
    } else {
      this.logger.debug(`Audio player found`);
    }
  };

  get isPlaying() {
    return this.player.state.status !== AudioPlayerStatus.Idle;
  }
  get playbackSecDuration() {
    const state = this.player.state as AudioPlayerPlayingState;
    if (!state.resource) return 0;

    return Math.floor(state.playbackDuration / 1000);
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

  destroy = () => {
    this.player.removeAllListeners();
    Player.players.delete(this.server.guildId);
    this.logger.debug(`Player destroyed`);
  };

  private get player() {
    const player = this.getPlayer();
    if (!player) {
      throw new SGError('Player not found? Why?');
    }
    return player;
  }

  private playSong = async (song: Song) => {
    try {
      autoDisconnectControl.deleteTimeout(this.server.guildId);
      const resource = await this.createResource(song);
      this.logger.debug('Resource found');

      this.play(resource);
    } catch (_) {
      throw new SGError('Format not found');
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
      const server = await database.findServer(this.server.guildId);
      const voiceConnection = getVoiceConnection(server.guildId);
      if (!voiceConnection) {
        this.logger.error('Voice connection not found on startNextTrack');
        throw new SGError('Voice connection not found');
      }

      if (!server.voiceChannel) return;
      const voiceChannel = await botClient.getVoiceChannel(server.voiceChannel);
      if (!voiceChannel.members.size) {
        const leave = new Leave();
        await leave.start(this.server);
        autoDisconnectControl.deleteTimeout(server.guildId);
        this.logger.error('Voice channel empty - leave');
      }

      entersState(voiceConnection, VoiceConnectionStatus.Ready, 30e3);
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
        server.songs.push(dbAutoPlaySong);
        this.sendAutoPlayMessage(server);
        return await this.playSong(dbAutoPlaySong);
      }

      autoDisconnectControl.createTimeout(
        server.guildId,
        async () => {
          const leave = new Leave();
          await leave.start(server);
          this.logger.debug('Auto disconnect complete');
        },
        this.autoDisconnectTimeout,
      );
      this.logger.debug('Auto disconnect started');
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
      throw new SGError('Voice connection not found');
    }
    const audioPlayer = createAudioPlayer();
    Player.players.set(this.server.guildId, audioPlayer);
    await entersState(voiceConnection, VoiceConnectionStatus.Ready, 30e3);
    voiceConnection.subscribe(audioPlayer);
    voiceConnection.configureNetworking();
    this.logger.debug(`Audio player created`);
  };

  private sendAutoPlayMessage = async (server: Server) => {
    if (!server.textChannel) {
      this.logger.debug('Text channel not found');
      throw new SGError('Text channel not found');
    }
    const textChannel = await botClient.getTextChannel(server.textChannel);
    const embed = new EmbedGenerator();
    embed.setYoutubePlay(server, this.playbackSecDuration, true);
    textChannel.send({ embeds: [embed.embed] });
  };
}
