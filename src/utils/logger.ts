import pino from 'pino';
import pretty from 'pino-pretty';

export class Logger {
  private static pinoPretty = pretty({
    colorize: true,
    singleLine: true,
  });
  private static pinoLogger = pino(
    {
      level: 'debug',
    },
    this.pinoPretty,
  );
  private logger = Logger.pinoLogger.child({ component: this.componentName, guildId: this.guildId });

  constructor(
    private componentName: string,
    private guildId?: string,
  ) {}

  get childLogger() {
    return this.logger;
  }
}
