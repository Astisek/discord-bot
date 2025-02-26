import { AppDataSource } from '@modules/database/dataSource';
import { Server } from '@modules/database/entities/Server';
import { Song } from '@modules/database/entities/Song';
import { Logger } from '@utils/logger';

class DataBase {
  private logger = new Logger('DataBase').childLogger;
  private serverRepository = AppDataSource.getRepository(Server);
  private songRepository = AppDataSource.getRepository(Song);

  findServer = async (guildId: string) => {
    const result = await this.serverRepository.findOne({ where: { guildId }, relations: ['songs'] });
    if (result) {
      return result;
    }

    const server = this.serverRepository.create({
      guildId,
    });
    await this.serverRepository.save(server);
    this.logger.debug(`Server found ${server.guildId}`);
    return server;
  };

  updateServer = async (server: Server) => {
    await this.serverRepository.save(server);
    this.logger.debug(`Server updated ${server.guildId}`);
  };

  removeSong = async (songId: number) => {
    await this.songRepository.softDelete(songId);
    this.logger.debug(`Removed song ${songId}`);
  };

  addSong = async (guildId: string, song: Omit<Song, 'id'>) => {
    const newSong = this.songRepository.create({
      ...song,
      server: {
        guildId,
      },
    });
    await this.songRepository.save(newSong);
    this.logger.debug(`Added song ${song.title} to ${guildId}`);
  };
}

export const database = new DataBase();
