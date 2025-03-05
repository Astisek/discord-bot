import { Logger } from '@utils/logger';

class AutoDisconnectControl {
  private logger = new Logger('AutoDisconnectControl').childLogger;
  private static timers = new Map<string, NodeJS.Timeout>();

  createTimeout = (guildId: string, callback: () => void, milliseconds: number) => {
    const timeOut = setTimeout(callback, milliseconds);
    AutoDisconnectControl.timers.set(guildId, timeOut);
    this.logger.debug(`Auto disconnect started on ${guildId}`);
  };

  deleteTimeout = (guildId: string) => {
    const timeout = AutoDisconnectControl.timers.get(guildId);
    if (!timeout) {
      this.logger.debug(`Auto disconnect notfound on ${guildId}`);
      return;
    }

    clearTimeout(guildId);
    AutoDisconnectControl.timers.delete(guildId);
    this.logger.debug(`Auto disconnect deleted and stopped on ${guildId}`);
  };
}

export const autoDisconnectControl = new AutoDisconnectControl();
