import { AppDataSource } from '@modules/database/dataSource';
import { AutoPlayBuffer } from '@modules/database/entities/AutoPlayBuffer';
import { Server } from '@modules/database/entities/Server';
import { Song } from '@modules/database/entities/Song';
import { SongToCreate } from '@modules/database/interfaces/songs';
import { Logger } from '@utils/logger';

class DataBase {
  private logger = new Logger('DataBase').childLogger;
  private serverRepository = AppDataSource.getRepository(Server);
  private songRepository = AppDataSource.getRepository(Song);
  private autoPlayBufferRepository = AppDataSource.getRepository(AutoPlayBuffer);

  findServer = async (guildId: string) => {
    const result = await this.serverRepository.findOne({
      where: { guildId },
      relations: ['songs', 'autoplayBuffer'],
      order: { songs: { ordinal: 'ASC' } },
    });
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

  removeSong = async (songId: number, guildId: string) => {
    await this.songRepository.softDelete(songId);
    await this.updateSongsOrdinalByGuildId(guildId);
    this.logger.debug(`Removed song ${songId}`);
  };

  clearSongs = async (server: Server) => {
    server.songs.shift();
    await this.songRepository.softDelete(server.songs.map(({ id }) => id));
    this.logger.debug(`Queue cleared`);
  };

  addSong = async (guildId: string, song: SongToCreate) => {
    const songs = await this.songRepository.find({
      where: { server: { guildId } },
      order: { ordinal: 'ASC' },
    });
    const lastSongOrdinal = songs?.[songs.length - 1]?.ordinal || 0;
    const newSong = this.songRepository.create({
      ...song,
      ordinal: lastSongOrdinal + 1,
      server: {
        guildId,
      },
    });
    await this.songRepository.save(newSong);
    this.logger.debug(`Added song ${song.title} to ${guildId}`);
    return newSong;
  };

  moveSong = async (guildId: string, prevOrdinal: number, newOrdinal: number) => {
    const songs = await this.songRepository.find({
      where: { server: { guildId } },
      order: { ordinal: 'ASC' },
    });

    if (!songs.length) {
      return this.logger.debug(`Songs not found`);
    }

    const songIndex = songs.findIndex(({ ordinal }) => ordinal === prevOrdinal);

    const [movedSong] = songs.splice(songIndex, 1);
    songs.splice(newOrdinal - 1, 0, movedSong);

    await this.updateSongsOrdinal(songs);
    this.logger.debug(`Song ${prevOrdinal} position updated to ${newOrdinal}`);
  };

  addAutoplayBuffer = async (guildId: string, url: string) => {
    const autoPlayBuffer = this.autoPlayBufferRepository.create({
      url,
      server: {
        guildId,
      },
    });
    await this.autoPlayBufferRepository.save(autoPlayBuffer);
    return autoPlayBuffer;
  };

  clearAutoplayBuffer = async (guildId: string) => {
    await this.autoPlayBufferRepository.softDelete({ server: { guildId } });
  };
  findAutoPlayUrls = async (guildId: string) => {
    const data = await this.autoPlayBufferRepository.find({ where: { server: { guildId } } });
    return data.map(({ url }) => url);
  };

  private updateSongsOrdinal = async (songs: Song[]) => {
    songs.forEach((song, index) => (song.ordinal = index + 1));

    await this.songRepository.save(songs);
  };
  private updateSongsOrdinalByGuildId = async (guildId: string) => {
    const songs = await this.songRepository.find({
      where: { server: { guildId } },
      order: { ordinal: 'ASC' },
    });
    await this.updateSongsOrdinal(songs);
  };
}

export const database = new DataBase();
