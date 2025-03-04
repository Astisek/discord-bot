import { Song } from '@modules/database/entities/Song';

export enum SongTypeEnum {
  Youtube = 'Youtube',
  Custom = 'Custom',
}

export type SongToCreate = Omit<Song, 'id' | 'ordinal' | 'isAutoplay'>;
