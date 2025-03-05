import { Command } from '@commands/command';
import { Server } from '@modules/database/entities/Server';
import { joinVoiceChannel } from '@discordjs/voice';
import { GuildMember, MessageEditOptions, SlashCommandBuilder } from 'discord.js';
import pino from 'pino';
import { Logger } from '@utils/logger';

export class Join implements Command {
  static commandKeys = ['join', 'j'];
  static builder = new SlashCommandBuilder().setName('join').setDescription('Soon');
  private logger: pino.Logger;

  start = async (server: Server, _: string[], guildMember: GuildMember) => {
    this.logger = new Logger('Join').childLogger;

    joinVoiceChannel({
      channelId: server.voiceChannel || '',
      guildId: server.guildId,
      adapterCreator: guildMember.guild.voiceAdapterCreator,
    });
    this.logger.debug('Connected to voice channel');
  };

  successContent = async (): Promise<MessageEditOptions> => ({
    content: `:thumbsup:  Connected to the voice channel`,
  });
}
