// Custom database provider that connects AFTER NestJS starts
import { Module, Global, OnApplicationBootstrap, Injectable, DynamicModule } from '@nestjs/common';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfigFactory } from './database.config';

// Import all entities so they're available when we connect
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

@Injectable()
export class DatabaseConnectionService implements OnApplicationBootstrap {
  private dataSource: DataSource | null = null;
  private isConnected = false;
  private connectionError: Error | null = null;
  
  constructor(private configService: ConfigService) {}
  
  /**
   * This runs AFTER the HTTP server is listening
   * Database connection happens here, not during module initialization
   */
  async onApplicationBootstrap() {
    console.log('[DatabaseConnection] App fully bootstrapped - now connecting to database...');
    
    try {
      const baseConfig = databaseConfigFactory(this.configService) as DataSourceOptions;
      const config: DataSourceOptions = {
        ...baseConfig,
        entities,
        synchronize: false,
        migrationsRun: false,
        logging: ['error', 'warn'],
      };
      
      this.dataSource = new DataSource(config);
      
      // Try to connect with timeout
      const connectPromise = this.dataSource.initialize();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout after 10s')), 10000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      
      this.isConnected = true;
      console.log('[DatabaseConnection] ✅ Successfully connected to database');
    } catch (error) {
      this.connectionError = error as Error;
      console.error('[DatabaseConnection] ❌ Failed to connect:', error.message);
      console.log('[DatabaseConnection] App will continue running without database');
    }
  }
  
  getDataSource(): DataSource | null {
    return this.dataSource;
  }
  
  isReady(): boolean {
    return this.isConnected;
  }
  
  getError(): Error | null {
    return this.connectionError;
  }
}

@Global()
@Module({})
export class PostStartupDatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: PostStartupDatabaseModule,
      imports: [
        // Register TypeORM with entities but NO DataSource (we create it manually)
        TypeOrmModule.forFeature(entities),
      ],
      providers: [DatabaseConnectionService],
      exports: [DatabaseConnectionService, TypeOrmModule],
    };
  }
}

