import * as common from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from '../stripe.service';
import { PaymentsService } from '../../payments/payments.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import Stripe from 'stripe';

@common.Controller('stripe/webhook')
export class StripeWebhookController {
  private readonly logger = new common.Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly paymentsService: PaymentsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // @common.Post()
  // @common.HttpCode(200)
  // async handleWebhook(
  //   @common.Headers('stripe-signature') signature: string,
  //   @common.Req() request: common.RawBodyRequest<Request>,
  // ) {
  //   let event: Stripe.Event;

  //   try {
  //     // Verify webhook signature
  //     event = this.stripeService.constructWebhookEvent(
  //       request.rawBody,
  //       signature,
  //     );
  //   } catch (err) {
  //     this.logger.error(
  //       `Webhook signature verification failed: ${err.message}`,
  //     );
  //     return { error: 'Webhook signature verification failed' };
  //   }

  //   this.logger.log(`Received webhook event: ${event.type}`);

  //   // Handle different event types
  //   try {
  //     switch (event.type) {
  //       // Payment events
  //       case 'payment_intent.succeeded':
  //         await this.handlePaymentSuccess(
  //           event.data.object as Stripe.PaymentIntent,
  //         );
  //         break;

  //       case 'payment_intent.payment_failed':
  //         await this.handlePaymentFailed(
  //           event.data.object as Stripe.PaymentIntent,
  //         );
  //         break;

  //       // Subscription events
  //       case 'customer.subscription.created':
  //         await this.handleSubscriptionCreated(
  //           event.data.object as Stripe.Subscription,
  //         );
  //         break;

  //       case 'customer.subscription.updated':
  //         await this.handleSubscriptionUpdated(
  //           event.data.object as Stripe.Subscription,
  //         );
  //         break;

  //       case 'customer.subscription.deleted':
  //         await this.handleSubscriptionDeleted(
  //           event.data.object as Stripe.Subscription,
  //         );
  //         break;

  //       // Invoice events
  //       case 'invoice.paid':
  //         await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
  //         break;

  //       case 'invoice.payment_failed':
  //         await this.handleInvoicePaymentFailed(
  //           event.data.object as Stripe.Invoice,
  //         );
  //         break;

  //       default:
  //         this.logger.log(`Unhandled event type: ${event.type}`);
  //     }
  //   } catch (error) {
  //     this.logger.error(`Error handling webhook: ${error.message}`);
  //     throw error;
  //   }

  //   return { received: true };
  // }

  // private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  //   this.logger.log(`Payment succeeded: ${paymentIntent.id}`);

  //   // Update payment record in database
  //   // await this.paymentsService.updatePaymentStatus(
  //   //   paymentIntent.id,
  //   //   'SUCCESS',
  //   // );
  // }

  // private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  //   this.logger.error(`Payment failed: ${paymentIntent.id}`);

  //   // Update payment record and notify user
  //   // await this.paymentsService.updatePaymentStatus(
  //   //   paymentIntent.id,
  //   //   'FAILED',
  //   // );
  // }

  // private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
  //   this.logger.log(`Subscription created: ${subscription.id}`);
  //   // Handle new subscription
  // }

  // private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  //   this.logger.log(`Subscription updated: ${subscription.id}`);
  //   // Handle subscription changes
  // }

  // private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  //   this.logger.log(`Subscription deleted: ${subscription.id}`);
  //   // Handle subscription cancellation
  // }

  // private async handleInvoicePaid(invoice: Stripe.Invoice) {
  //   this.logger.log(`Invoice paid: ${invoice.id}`);
  //   // Record successful payment
  // }

  // private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  //   this.logger.error(`Invoice payment failed: ${invoice.id}`);
  //   // Handle failed payment, notify user
  // }
}
