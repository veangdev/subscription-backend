// src/config/database.config.ts
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import { User } from '../users/entities/user.entity';
import { Role } from '../access-control/entities/role.entity';
import { Permission } from '../access-control/entities/permission.entity';
import { SubscriptionPlan } from '../subscription-plans/entities/subscription-plan.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Address } from '../addresses/entities/address.entity';
import { Shipment } from '../shipments/entities/shipment.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { AddRbacAndUserStatus1741377600000 } from '../database/migrations/1741377600000-add-rbac-and-user-status';
import * as path from 'path';

loadLocalEnvFile();

const migrations = [AddRbacAndUserStatus1741377600000];

export const databaseConfigFactory = (
  config: ConfigService,
): TypeOrmModuleOptions => {
  const host = config.getOrThrow('DATABASE_HOST');
  const isUnixSocket = host.startsWith('/');
  
  // CRITICAL FOR CLOUD RUN: Absolute minimal blocking during startup
  const connectionTimeout = Number(config.get('DB_CONNECTION_TIMEOUT_MS', 500));
  const retryAttempts = Number(config.get('DB_RETRY_ATTEMPTS', 0));
  const retryDelay = Number(config.get('DB_RETRY_DELAY_MS', 100));
  
  const connectionConfig: any = {
    type: 'postgres',
    username: config.getOrThrow('DATABASE_USER'),
    password: config.getOrThrow('DATABASE_PASSWORD'),
    database: config.getOrThrow('DATABASE_NAME'),
    autoLoadEntities: true,
    migrations,
    migrationsRun: false, // Never run migrations on startup
    synchronize: false, // Never sync schema on startup
    retryAttempts, // NO retries - fail immediately
    retryDelay,
    verboseRetryLog: false,
    logging: false,
    poolErrorHandler: () => {}, // Ignore pool errors during startup
    extra: {
      connectionTimeoutMillis: connectionTimeout, // Fail immediately if DB not ready
      query_timeout: 30000,
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 60000,
      max: 5,
      min: 0, // No minimum connections
      idleTimeoutMillis: 30000,
    },
  };

  if (isUnixSocket) {
    // For Unix socket connections (Cloud SQL), only set host (no port)
    connectionConfig.host = host;
  } else {
    // For TCP connections
    connectionConfig.host = host;
    connectionConfig.port = Number(config.get('DATABASE_PORT', 5432));
  }
  
  return connectionConfig;
};

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
    Role,
    Permission,
    SubscriptionPlan,
    Subscription,
    Address,
    Shipment,
    InventoryItem,
    Coupon,
  ],
  migrations,
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});

function loadLocalEnvFile() {
  const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
  const envPath = path.resolve(process.cwd(), envFile);

  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, 'utf8');

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = stripWrappingQuotes(value);
  }
}

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
