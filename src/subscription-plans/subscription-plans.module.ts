import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Product } from './entities/product.entity';
import { AccessControlModule } from '../access-control/access-control.module';
import { FileStorageModule } from '../file-storage/file-storage.module';

@Module({
  imports: [
    AccessControlModule,
    FileStorageModule,
    TypeOrmModule.forFeature([SubscriptionPlan, Product]),
  ],
  controllers: [SubscriptionPlansController],
  providers: [SubscriptionPlansService],
  exports: [SubscriptionPlansService],
})
export class SubscriptionPlansModule {}
