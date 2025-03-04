import { availableCommands } from '@data/availableCommands';
import { Player } from '@modules/audioPlayer';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { Message } from 'discord.js';
import pino from 'pino';

class MessageCommandSelector {
  private logger: pino.Logger;

  // TODO: Разделить на методы
  start = async (message: Message<true>) => {
    this.logger = new Logger('MessageCommandSelector', message.guildId).childLogger;
    const server = await database.findServer(message.guildId);
    const isCommand = message.content.startsWith(server.prefix);

    if (!isCommand) {
      return;
    }
    this.logger.debug('Command detected');
    const loadingMessage = await message.channel.send({ content: '<a:loading_aaa:1344667013976428596> Loading...' });

    try {
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

      this.logger.debug('Command action staring...');
      await commandAction.start(server, args, message.member, message.attachments.first());
      this.logger.debug('Command action complete!');

      this.logger.debug('Try successContent...');
      const successContent = await commandAction?.successContent?.();
      if (successContent) {
        await loadingMessage.edit({
          content: '',
          ...successContent,
        });
        this.logger.debug('SuccessContent sended');
      }

      this.logger.debug('Command complete');
    } catch (e) {
      if (e instanceof Error) {
        loadingMessage.edit({
          content: e.message,
        });
      }
    }
  };

  private updateChannels = async (message: Message<true>, server: Server) => {
    try {
      const player = new Player(server);
      await player.init();
      if (server.textChannel && server.voiceChannel && player.isPlaying) {
        this.logger.debug('Text and voice channel not updated');
        return;
      }
      throw new Error();
    } catch (_) {
      server.textChannel = message.channelId;
      server.voiceChannel = message.member?.voice.channelId || '';
      await database.clearAutoplayBuffer(server.guildId);
      await database.updateServer(server);
      this.logger.debug('Updated text and voice channel!');
    }
  };
}

export const messageCommandSelector = new MessageCommandSelector();
