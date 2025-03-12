import { Command } from '@commands/command';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { MessageEditOptions, SlashCommandBuilder } from 'discord.js';

export class Repeat implements Command {
  static builder = new SlashCommandBuilder().setName('repeat').setDescription('Soon');
  static commandKeys = ['repeat'];

  private repeatStatus: boolean;

  start = async (server: Server) => {
    server.isRepeat = !server.isRepeat;
    this.repeatStatus = server.isRepeat;
    await database.updateServer(server);
  };

  successContent = async (): Promise<MessageEditOptions> => ({
    content: this.repeatStatus ? `:thumbsup: **Repeat enabled!**` : `:thumbsup: **Repeat disabled!**`,
  });
}
