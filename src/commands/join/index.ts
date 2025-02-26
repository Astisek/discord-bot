import { Command } from '@commands/command';
import { Server } from '@modules/database/entities/Server';
import { joinVoiceChannel } from '@discordjs/voice';
import { GuildMember, MessageCreateOptions } from 'discord.js';
import pino from 'pino';
import { Logger } from '@utils/logger';

class Join implements Command {
  private logger: pino.Logger;
  public commandKeys = ['join', 'j'];

  public start = async (server: Server, _: string[], guildMember: GuildMember) => {
    this.logger = new Logger('Join').childLogger;

    joinVoiceChannel({
      channelId: server.voiceChannel || '',
      guildId: server.guildId,
      adapterCreator: guildMember.guild.voiceAdapterCreator,
    });
    this.logger.debug('Connected to voice channel');
  };

  public successContent = async (): Promise<MessageCreateOptions> => ({
    content: `:thumbsup:  Connected to the voice channel`,
  });
}

export const join = new Join();
