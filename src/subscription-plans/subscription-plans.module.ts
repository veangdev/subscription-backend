import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { AccessControlModule } from '../access-control/access-control.module';

@Module({
  imports: [AccessControlModule, TypeOrmModule.forFeature([SubscriptionPlan])],
  controllers: [SubscriptionPlansController],
  providers: [SubscriptionPlansService],
  exports: [SubscriptionPlansService],
})
export class SubscriptionPlansModule {}
