import { Server } from '@modules/database/entities/Server';
import { GuildMember, MessageCreateOptions } from 'discord.js';

export abstract class Command {
  public commandKeys: string[];

  public start: (server: Server, args: string[], guildMember: GuildMember) => Promise<void>;
  public successContent?: () => Promise<MessageCreateOptions>;
}
