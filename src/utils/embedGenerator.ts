import { botClient } from '@modules/botClient';
import { EmbedBuilder } from 'discord.js';

export class EmbedGenerator {
  private embedBuilder = new EmbedBuilder();

  constructor() {
    this.setDefaultStyles();
  }

  get embed() {
    return this.embedBuilder;
  }

  setStyles = (callback: (embedBuilder: EmbedBuilder) => void) => {
    callback(this.embedBuilder);
  };

  private setDefaultStyles() {
    this.embedBuilder
      .setAuthor({
        name: botClient.user?.displayName || '',
        iconURL: botClient.user?.avatarURL() || '',
      })
      .setFooter({
        text: botClient.user?.displayName || '',
      })
      .setTimestamp();
  }
}
