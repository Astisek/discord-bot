import { Server } from '@modules/database/entities/Server';
import { Attachment, GuildMember, MessageEditOptions } from 'discord.js';

export abstract class Command {
  public commandKeys: string[];

  public start: (server: Server, args: string[], guildMember: GuildMember, attachment?: Attachment) => Promise<void>;
  public successContent?: () => Promise<MessageEditOptions>;
}
