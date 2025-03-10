import { availableCommands } from '@data/availableCommands';
import { Player } from '@modules/audioPlayer';
import { database } from '@modules/database';
import { Server } from '@modules/database/entities/Server';
import { Logger } from '@utils/logger';
import { SGError } from '@utils/SGError';
import { Message } from 'discord.js';
import pino from 'pino';

export class MessageCommandSelector {
  private logger: pino.Logger;

  start = async (message: Message<true>) => {
    this.logger = new Logger('MessageCommandSelector', message.guildId).childLogger;
    const server = await database.findServer(message.guildId);
    const isCommand = message.content.startsWith(server.prefix);

    if (!isCommand) {
      return;
    }
    this.logger.debug('Command detected');
    const loadingMessage = await message.channel.send({ content: '<a:loading_aaa:1348205846571647017> Loading...' });

    try {
      const [commandWithPrefix, ...args] = message.content.split(' ');
      const command = commandWithPrefix.replace(server.prefix, '');

      const CommandAction = availableCommands.find(({ commandKeys }) => commandKeys.includes(command));

      if (!CommandAction) {
        this.logger.debug('Command not found');
        throw new SGError('Command not found!');
      }
      if (!message.member?.voice.channelId) {
        this.logger.debug('voice.channelId not found');
        throw new SGError('Join to voice channel');
      }

      await this.updateChannels(message, server);

      this.logger.debug('Command action staring...');
      const commandAction = new CommandAction();
      await commandAction.start(server, args, message.member, message.attachments.first());
      this.logger.debug('Command action complete');

      this.logger.debug('Try successContent...');
      const successContent = await commandAction.successContent();
      if (successContent) {
        await loadingMessage.edit({
          content: '',
          ...successContent,
        });
        this.logger.debug('SuccessContent sended');
      }

      this.logger.debug('Command complete');
      message.delete();
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
      await Promise.all([
        database.clearSongs(server),
        database.clearAutoplayBuffer(server.guildId),
        database.updateServer(server),
      ]);
      this.logger.debug('Updated text and voice channel');
    }
  };
}
