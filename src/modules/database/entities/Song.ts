import { Server } from '@modules/database/entities/Server';
import { SongTypeEnum } from '@modules/database/interfaces/songs';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Song {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  songType: SongTypeEnum;

  @Column('text')
  video_id: string;

  @Column('text')
  title: string;

  @Column('text')
  author: string;

  @Column({ nullable: true, type: 'text' })
  thumbnailUrl?: string;

  @Column('text')
  duration: number;

  @ManyToOne(() => Server, (server) => server.songs)
  server: Server;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
