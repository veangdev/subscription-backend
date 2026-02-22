// src/config/database.config.ts
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

dotenv.config();
export const databaseConfigFactory = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.getOrThrow('DATABASE_HOST'),
  port: config.get<number>('DATABASE_PORT', 5432),
  username: config.getOrThrow('DATABASE_USER'),
  password: config.getOrThrow('DATABASE_PASSWORD'),
  database: config.getOrThrow('DATABASE_NAME'),
  autoLoadEntities: true,
  synchronize: config.get('DB_SYNC', 'false') === 'true',
});
