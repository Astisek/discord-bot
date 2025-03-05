import { Server } from '@modules/database/entities/Server';
import {
  Attachment,
  GuildMember,
  MessageEditOptions,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from 'discord.js';

export abstract class Command {
  public static commandKeys: string[];
  public static builder: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;

  public start: (server: Server, args: string[], guildMember: GuildMember, attachment?: Attachment) => Promise<void>;
  public successContent?: () => Promise<MessageEditOptions>;
}
