// Dynamic TypeORM provider that connects AFTER NestJS starts
import { DataSource, DataSourceOptions } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { databaseConfigFactory } from './database.config';

// Import entities
import { User } from '../users/entities/user.entity';
import { Role } from '../access-control/entities/role.entity';
import { Permission } from '../access-control/entities/permission.entity';
import { SubscriptionPlan } from '../subscription-plans/entities/subscription-plan.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Address } from '../addresses/entities/address.entity';
import { Shipment } from '../shipments/entities/shipment.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { Coupon } from '../coupons/entities/coupon.entity';

const entities = [User, Role, Permission, SubscriptionPlan, Subscription, Address, Shipment, InventoryItem, Coupon];

const typeormDynamicProviders = [
  {
    provide: getDataSourceToken(),
    useFactory: async (configService: ConfigService) => {
      // Create DataSource but DON'T initialize yet
      const config = databaseConfigFactory(configService) as DataSourceOptions;
      const dataSource = new DataSource({
        ...config,
        entities,
        synchronize: false,
        migrationsRun: false,
        logging: ['error'],
      });

      console.log('[TypeORM] DataSource created, connecting in background...');

      // Initialize asynchronously - don't block
      dataSource.initialize()
        .then(() => {
          console.log('[TypeORM] ✅ Database connected successfully');
        })
        .catch((error) => {
          console.error('[TypeORM] ❌ Database connection failed:', error.message);
          console.log('[TypeORM] App will continue without database');
        });

      // Return the DataSource immediately (uninitialized)
      // Queries will queue until connection is ready or fail if connection fails
      return dataSource;
    },
    inject: [ConfigService],
  },
];

export default typeormDynamicProviders;
