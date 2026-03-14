import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './webhooks/stripe-webhook.controller';
import { PaymentsModule } from '../payments/payments.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SubscriptionPlansModule } from '../subscription-plans/subscription-plans.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StripeSubscriptionsController } from './stripe-subscriptions.controller';

@Module({
  imports: [
    ConfigModule,
    PaymentsModule,
    SubscriptionsModule,
    SubscriptionPlansModule,
    NotificationsModule,
  ],
  controllers: [StripeWebhookController, StripeSubscriptionsController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
