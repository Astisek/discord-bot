import { Command } from '@commands/command';
import { Join } from '@commands/join';
import { Player } from '@modules/audioPlayer';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { EmbedGenerator } from '@utils/embedGenerator';
import { Logger } from '@utils/logger';
import { SGError } from '@utils/SGError';
import { songUtils } from '@utils/songUtils';
import { youtube } from '@utils/youtube';
import { Attachment, GuildMember, MessageEditOptions, SlashCommandBuilder } from 'discord.js';
import pino from 'pino';
import { PlaylistVideo } from 'youtubei.js/dist/src/parser/nodes';
import { Playlist } from 'youtubei.js/dist/src/parser/youtube';

export class Play implements Command {
  static commandKeys = ['play', 'p'];
  static builder = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Soon')
    .addStringOption((option) => option.setName('url').setDescription('url').setRequired(true));

  private logger: pino.Logger;
  private successEmbed: EmbedGenerator;
  private player: Player;
  private server: Server;
  private argumentUrl: string;
  private guildMember: GuildMember;
  private attachment?: Attachment;

  start = async (server: Server, args: string[], guildMember: GuildMember, attachment?: Attachment) => {
    this.logger = new Logger('Command-Play', server.guildId).childLogger;

    const join = new Join();
    await join.start(server, args, guildMember);
    this.logger.debug(`Joined to voice channel`);

    this.player = new Player(server);
    await this.player.init();
    this.logger.debug(`Player found`);

    if (!args[0] && !attachment) {
      this.logger.debug('Arguments not found');
      throw new SGError('Arguments not found');
    }

    this.argumentUrl = args[0];
    this.server = server;
    this.guildMember = guildMember;
    this.attachment = attachment;

    await this.processArguments();

    if (!this.player.isPlaying) {
      this.logger.debug(`Player not playing starting...`);
      await this.player.start();
    }
  };

  successContent = async (): Promise<MessageEditOptions> => ({
    embeds: [this.successEmbed.embed],
  });

  private processArguments = async () => {
    try {
      if (
        this.argumentUrl?.indexOf('https://youtu.be/') >= 0 ||
        this.argumentUrl?.indexOf('https://www.youtube.com') >= 0
      ) {
        if (youtube.getPlaylistId(this.argumentUrl)) {
          return await this.playYoutubePlaylistUrl();
        } else if (youtube.getVideoId(this.argumentUrl)) {
          return await this.playYoutubeSingleUrl();
        }
      }
      if (this.attachment) {
        return await this.playCustom();
      }
      throw new SGError('Resource not found');
    } catch (e) {
      this.logger.debug(e);
      throw new SGError('Invalid arguments');
    }
  };

  private playYoutubePlaylistUrl = async () => {
    try {
      const playlistId = youtube.getPlaylistId(this.argumentUrl);
      const playlist = await youtube.yt.getPlaylist(playlistId);
      const videos = playlist.videos as PlaylistVideo[];

      this.logger.debug(`Youtube metadata found`);

      const songs = songUtils.fromPlaylistVideos(videos, this.server, this.guildMember);

      await Promise.all(songs.map((song) => database.addSong(this.server.guildId, song)));
      this.logger.debug(`${songs.length} songs added!`);

      await this.createPlaylistEmbed(playlist);
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error(e.message);
      }
      throw new SGError(`Playlist: ${this.argumentUrl}, not found!`);
    }
  };

  private playYoutubeSingleUrl = async () => {
    try {
      const videoId = youtube.getVideoId(this.argumentUrl);
      const { basic_info } = await youtube.yt.getBasicInfo(videoId);

      this.logger.debug(`Youtube metadata found`);

      const song = songUtils.formBasicInfo(basic_info, this.server, this.guildMember);

      await database.addSong(this.server.guildId, song);
      this.logger.debug(`single songs added`);

      await this.createSingleEmbed();
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error(e.message);
      }
      throw new SGError(`Youtube video: ${this.argumentUrl}, not found!`);
    }
  };

  // Play функции вынести в отдельный класс
  private playCustom = async () => {
    if (!this.attachment) {
      this.logger.debug(`Attachment not found`);
      throw new SGError('Attachment not found');
    }
    const song = songUtils.fromAttachment(this.attachment, this.server, this.guildMember);

    await database.addSong(this.server.guildId, song);

    this.logger.debug(`single custom songs added`);
    await this.createCustomEmbed();
  };

  private createSingleEmbed = async () => {
    const server = await database.findServer(this.server.guildId);

    this.successEmbed = new EmbedGenerator();
    this.successEmbed.setYoutubePlay(server, this.player.playbackSecDuration, false);
  };

  private createPlaylistEmbed = async (playlist: Playlist) => {
    this.successEmbed = new EmbedGenerator();
    this.successEmbed.setYoutubeList(playlist);
  };

  private createCustomEmbed = async () => {
    const server = await database.findServer(this.server.guildId);
    this.successEmbed = new EmbedGenerator();
    this.successEmbed.setCustom(server);
  };
}
