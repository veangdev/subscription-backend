import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { LazyDatabaseModule } from './config/lazy-database.module';
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
    LazyDatabaseModule.forRootAsync(), // TypeORM with non-blocking config
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
