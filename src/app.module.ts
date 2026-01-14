import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
// import { databaseConfig } from './config/database.config';
import dotenv from 'dotenv';

// Import all modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SubscriptionPlansModule } from './subscription-plans/subscription-plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { InventoryModule } from './inventory/inventory.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { CouponsModule } from './coupons/coupons.module';
import { ReportsModule } from './reports/reports.module';
import { databaseConfig } from './config/database.config';
import { StripeModule } from './stripe/stripe.module';

dotenv.config();

@Module({
  imports: [
    // Environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRoot(databaseConfig),

    // Scheduling for recurring billing
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    UsersModule,
    SubscriptionPlansModule,
    SubscriptionsModule,
    PaymentsModule,
    InventoryModule,
    ShipmentsModule,
    CouponsModule,
    ReportsModule,
    StripeModule,
  ],
})
export class AppModule {}
