import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') || '',
      {
        apiVersion: '2025-12-15.clover',
      },
    );
  }

  // ============================================
  // Customer Management
  // ============================================

  /**
   * Create a Stripe customer
   */
  async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
      });
      this.logger.log(`Created Stripe customer: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error('Error creating Stripe customer', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  // async getCustomer(customerId: string): Promise<Stripe.Customer> {
  //   return await this.stripe.customers.retrieve(customerId);
  // }

  /**
   * Update customer
   */
  async updateCustomer(
    customerId: string,
    data: Stripe.CustomerUpdateParams,
  ): Promise<Stripe.Customer> {
    return await this.stripe.customers.update(customerId, data);
  }

  /**
   * Delete customer
   */
  async deleteCustomer(customerId: string): Promise<Stripe.DeletedCustomer> {
    return await this.stripe.customers.del(customerId);
  }

  // ============================================
  // Payment Methods
  // ============================================

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<Stripe.PaymentMethod> {
    const paymentMethod = await this.stripe.paymentMethods.attach(
      paymentMethodId,
      { customer: customerId },
    );

    // Set as default payment method
    await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return paymentMethod;
  }

  /**
   * Get customer payment methods
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return paymentMethods.data;
  }

  /**
   * Detach payment method
   */
  async detachPaymentMethod(
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    return await this.stripe.paymentMethods.detach(paymentMethodId);
  }

  // ============================================
  // Products & Prices (Subscription Plans)
  // ============================================

  /**
   * Create a product (subscription plan)
   */
  async createProduct(
    name: string,
    description: string,
  ): Promise<Stripe.Product> {
    return await this.stripe.products.create({
      name,
      description,
    });
  }

  /**
   * Create a price for a product
   */
  async createPrice(
    productId: string,
    amount: number,
    interval: 'day' | 'week' | 'month' | 'year',
    intervalCount: number = 1,
  ): Promise<Stripe.Price> {
    return await this.stripe.prices.create({
      product: productId,
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      recurring: {
        interval,
        interval_count: intervalCount,
      },
    });
  }

  // ============================================
  // Subscriptions
  // ============================================

  /**
   * Create a subscription
   */
  async createSubscription(
    customerId: string,
    priceId: string,
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      this.logger.log(`Created subscription: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error('Error creating subscription', error);
      throw error;
    }
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
  ): Promise<Stripe.Subscription> {
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);

    return await this.stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'always_invoice',
    });
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: 'keep_as_draft',
      },
    });
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.update(subscriptionId, {
      pause_collection: null,
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false,
  ): Promise<Stripe.Subscription> {
    if (immediately) {
      return await this.stripe.subscriptions.cancel(subscriptionId);
    } else {
      // Cancel at end of billing period
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
  }

  // ============================================
  // One-time Payments
  // ============================================

  /**
   * Create payment intent (one-time payment)
   */
  async createPaymentIntent(
    amount: number,
    customerId: string,
    description?: string,
  ): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      description,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.confirm(paymentIntentId);
  }

  // ============================================
  // Invoices
  // ============================================

  /**
   * Get customer invoices
   */
  async getInvoices(customerId: string): Promise<Stripe.Invoice[]> {
    const invoices = await this.stripe.invoices.list({
      customer: customerId,
      limit: 100,
    });
    return invoices.data;
  }

  /**
   * Get upcoming invoice
   */
  // async getUpcomingInvoice(customerId: string): Promise<Stripe.Invoice> {
  //   return await this.stripe.invoices.retrieveUpcoming({
  //     customer: customerId,
  //   });
  // }

  // ============================================
  // Webhooks
  // ============================================

  /**
   * Construct webhook event
   */
  // constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  //   const webhookSecret = this.configService.get<string>(
  //     'STRIPE_WEBHOOK_SECRET',
  //   );
  //   return this.stripe.webhooks.constructEvent(
  //     payload,
  //     signature,
  //     webhookSecret,
  //   );
  // }

  // ============================================
  // Refunds
  // ============================================

  /**
   * Create refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
  ): Promise<Stripe.Refund> {
    const refundData: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    return await this.stripe.refunds.create(refundData);
  }
}
