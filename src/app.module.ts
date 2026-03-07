import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { databaseConfigFactory } from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { SubscriptionPlansModule } from './subscription-plans/subscription-plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { CouponsModule } from './coupons/coupons.module';
import { InventoryModule } from './inventory/inventory.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { ReportsModule } from './reports/reports.module';
import { AuthModule } from './auth/auth.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AddressesModule } from './addresses/addresses.module';
import { StripeModule } from './stripe/stripe.module';
import { AccessControlModule } from './access-control/access-control.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // CRITICAL FOR CLOUD RUN: Lazy database connection - don't block startup
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        ...databaseConfigFactory(config),
        // CRITICAL: These prevent blocking during startup
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
        // Don't validate connection on startup
        dropSchema: false,
        logging: false,
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    AdminAuthModule,
    AccessControlModule,
    UsersModule,
    SubscriptionPlansModule,
    SubscriptionsModule,
    PaymentsModule,
    CouponsModule,
    InventoryModule,
    ShipmentsModule,
    ReportsModule,
    AddressesModule,
    StripeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
