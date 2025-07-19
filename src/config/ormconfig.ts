import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Meeting } from '../entities/Meeting';
import { Transcription } from '../entities/Transcription';
import { ChatSegment } from '../entities/ChatSegment';
import { ActionItem } from '../entities/ActionItem';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false, // Auto-sync in development only
  logging: process.env.NODE_ENV === 'development',
  entities: [Meeting, Transcription, ChatSegment, ActionItem],
  migrations: [__dirname + '/../migrations/**/*.js'],
  subscribers: [__dirname + '/../subscribers/**/*.js'],
  ssl: {
    rejectUnauthorized: false,
  },
});
