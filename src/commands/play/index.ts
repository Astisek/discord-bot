import { Command } from '@commands/command';
import { Join } from '@commands/join';
import { playUtils } from '@commands/play/playUtils';
import { Player } from '@modules/audioPlayer';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { EmbedGenerator } from '@utils/embedGenerator';
import { Logger } from '@utils/logger';
import { SGError } from '@utils/SGError';
import { youtube } from '@utils/youtube';
import { Attachment, GuildMember, MessageEditOptions, SlashCommandBuilder } from 'discord.js';
import pino from 'pino';
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
      // Youtube url
      if (
        this.argumentUrl?.indexOf('https://youtu.be/') >= 0 ||
        this.argumentUrl?.indexOf('https://www.youtube.com') >= 0
      ) {
        // Youtube playlist
        if (youtube.getPlaylistId(this.argumentUrl)) {
          const playlist = await playUtils.playYoutubePlaylistUrl(this.argumentUrl, this.server, this.guildMember);
          await this.createPlaylistEmbed(playlist);
          // Youtube single
        } else if (youtube.getVideoId(this.argumentUrl)) {
          await playUtils.playYoutubeSingleUrl(this.argumentUrl, this.server, this.guildMember);
          await this.createSingleEmbed();
        }
      }
      // Attachment song
      else if (this.attachment) {
        await playUtils.playCustom(this.attachment, this.server, this.guildMember);
        this.logger.debug(`Single custom songs added`);
        this.createCustomEmbed();
      } else {
        throw new SGError('Resource not found');
      }
    } catch (e) {
      this.logger.debug(e);
      throw new SGError('Invalid arguments');
    }
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
