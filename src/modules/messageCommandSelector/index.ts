import { availableCommands } from '@data/availableCommands';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { Message } from 'discord.js';
import pino from 'pino';

class MessageCommandSelector {
  private logger: pino.Logger;

  start = async (message: Message<true>) => {
    this.logger = new Logger('MessageCommandSelector', message.guildId).childLogger;
    const server = await database.findServer(message.guildId);
    const isCommand = message.content.startsWith(server.prefix);

    if (!isCommand) {
      return;
    }
    this.logger.debug('Command detected');

    const [commandWithPrefix, ...args] = message.content.split(' ');
    const command = commandWithPrefix.replace(server.prefix, '');

    const commandAction = availableCommands.find(({ commandKeys }) => commandKeys.includes(command));

    if (!commandAction) {
      this.logger.debug('Command not found');
      throw new Error(':x: **Command not found!**');
    }
    if (!message.member?.voice.channelId) {
      this.logger.debug('voice.channelId not found');
      throw new Error(':x: **Join to voice channel!**');
    }

    await this.updateChannels(message, server);

    this.logger.debug('Command staring...');
    await commandAction.start(server, args, message.member);
    this.logger.debug('Command complete!');

    this.logger.debug('Try successContent...');
    const successContent = await commandAction?.successContent?.();
    if (successContent) {
      await message.channel.send(successContent);
      this.logger.debug('SuccessContent sended');
    }
    await message.delete();
    this.logger.debug('Message deleted');
  };

  private updateChannels = async (message: Message<true>, server: Server) => {
    if (server.textChannel && server.voiceChannel && server.songs.length) {
      this.logger.debug('Text and voice channel not updated');
      return;
    }

    if (
      (!server.textChannel && !server.voiceChannel) ||
      (server.textChannel && server.voiceChannel && !server.songs.length)
    ) {
      server.textChannel = message.channelId;
      server.voiceChannel = message.member?.voice.channelId || '';
      await database.updateServer(server);
      this.logger.debug('Updated text and voice channel!');
    }
  };
}

export const messageCommandSelector = new MessageCommandSelector();
