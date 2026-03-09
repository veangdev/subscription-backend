import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from './entities/report.entity';
import { AccessControlModule } from '../access-control/access-control.module';
import { User } from '../users/entities/user.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Shipment } from '../shipments/entities/shipment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { SubscriptionPlan } from '../subscription-plans/entities/subscription-plan.entity';

@Module({
  imports: [
    AccessControlModule,
    TypeOrmModule.forFeature([
      Report,
      User,
      Subscription,
      Shipment,
      Payment,
      SubscriptionPlan,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
