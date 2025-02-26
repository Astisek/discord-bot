import { Server } from '@modules/database/entities/Server';
import { Song } from '@modules/database/entities/Song';
import { config } from '@utils/config';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.domain,
  port: config.database.port,
  username: config.database.userName,
  password: config.database.password,
  database: config.database.name,
  synchronize: config.isDev,
  logging: false,
  entities: [Server, Song],
  migrations: [],
});
