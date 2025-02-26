import { Song } from '@modules/database/entities/Song';
import { config } from '@utils/config';
import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, UpdateDateColumn } from 'typeorm';

@Entity()
export class Server {
  @Column('text', { unique: true, primary: true })
  guildId: string;

  @Column({ default: config.defaultPrefix, type: 'text' })
  prefix: string;

  @Column('text', { nullable: true })
  textChannel: string | null;

  @Column('text', { nullable: true })
  voiceChannel: string | null;

  @OneToMany(() => Song, (song) => song.server)
  songs: Song[];

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
