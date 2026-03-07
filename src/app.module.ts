import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { PostStartupDatabaseModule } from './config/post-startup-database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PostStartupDatabaseModule, // Database connects AFTER HTTP server starts
    ScheduleModule.forRoot(),
    // Database modules temporarily disabled until we implement manual connection handling
    // These modules expect TypeORM to be active, but we're using custom connection
    // TODO: Update each module to use DatabaseConnectionService instead of TypeORM
    // AuthModule,
    // AdminAuthModule,
    // AccessControlModule,
    // UsersModule,
    // SubscriptionPlansModule,
    // SubscriptionsModule,
    // PaymentsModule,
    // CouponsModule,
    // InventoryModule,
    // ShipmentsModule,
    // ReportsModule,
    // AddressesModule,
    // StripeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
