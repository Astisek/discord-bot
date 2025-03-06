import { Command } from '@commands/command';
import { Server } from '@modules/database/entities/Server';
import { getVoiceConnection, joinVoiceChannel } from '@discordjs/voice';
import { GuildMember, MessageEditOptions, SlashCommandBuilder } from 'discord.js';
import pino from 'pino';
import { Logger } from '@utils/logger';
import { Player } from '@modules/audioPlayer';

export class Join implements Command {
  static commandKeys = ['join', 'j'];
  static builder = new SlashCommandBuilder().setName('join').setDescription('Soon');
  private logger: pino.Logger;

  start = async (server: Server, _: string[], guildMember: GuildMember) => {
    this.logger = new Logger('Join').childLogger;

    const voiceConnection = getVoiceConnection(server.guildId);
    if (voiceConnection) {
      this.logger.debug('Already connected');
      return;
    }

    joinVoiceChannel({
      channelId: server.voiceChannel || '',
      guildId: server.guildId,
      adapterCreator: guildMember.guild.voiceAdapterCreator,
    });

    const player = new Player(server);
    await player.init(true);
    this.logger.debug('Connected to voice channel');
  };

  successContent = async (): Promise<MessageEditOptions> => ({
    content: `:thumbsup:  Connected to the voice channel`,
  });
}
