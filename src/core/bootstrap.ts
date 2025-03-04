import { botClient } from '@modules/botClient';
import { AppDataSource } from '@modules/database/dataSource';
import { Logger } from '@utils/logger';
import { youtube } from '@utils/youtube';

class Bootstrap {
  private logger = new Logger('Bootstrap').childLogger;

  start = () => {
    this.initializeBot();
    this.initializeDatabase();
    this.initializeYoutube();
  };

  private initializeYoutube = async () => {
    await youtube.initialize();
    this.logger.info('Youtube initialized!');
  };
  private initializeBot = () => {
    botClient.start();
  };
  private initializeDatabase = async () => {
    try {
      await AppDataSource.initialize();
      this.logger.info('Database Connected!');
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error(e.message);
        setTimeout(this.initializeDatabase, 1000);
      }
    }
  };
}

export const bootstrap = new Bootstrap();
