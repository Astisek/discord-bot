import { config } from '@utils/config';
import { join } from 'path';
import pino from 'pino';

export class Logger {
  private static pinoTransport = pino.transport({
    targets: [
      {
        level: config.isDev ? 'debug' : 'info',
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: true,
        },
      },
      {
        level: 'debug',
        target: 'pino/file',
        options: { destination: join(process.cwd(), 'logs', 'logs.log') },
      },
    ],
  });
  private static pinoLogger = pino(
    {
      level: 'debug',
      timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
    },
    Logger.pinoTransport,
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
