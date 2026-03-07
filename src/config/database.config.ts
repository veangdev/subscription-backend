// src/config/database.config.ts
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SubscriptionPlan } from '../subscription-plans/entities/subscription-plan.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Address } from '../addresses/entities/address.entity';
import { Shipment } from '../shipments/entities/shipment.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import * as path from 'path';

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

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

// Standalone DataSource for migrations and seeders
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [
    User,
    SubscriptionPlan,
    Subscription,
    Address,
    Shipment,
    InventoryItem,
    Coupon,
  ],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
