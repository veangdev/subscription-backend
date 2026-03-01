import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionPlan } from '../subscription-plans/entities/subscription-plan.entity';

export type StripeCheckoutClientSecrets = {
  paymentIntentClientSecret: string | null;
  setupIntentClientSecret: string | null;
};

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

  getPublishableKey(): string {
    const publishableKey = this.configService.get<string>(
      'STRIPE_PUBLISHABLE_KEY',
    );
    if (!publishableKey) {
      throw new InternalServerErrorException(
        'STRIPE_PUBLISHABLE_KEY is not configured',
      );
    }
    return publishableKey;
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

  async findOrCreateCustomer(
    email: string,
    name: string,
  ): Promise<Stripe.Customer> {
    const customers = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    const existing = customers.data[0];
    if (existing) {
      return existing;
    }

    return this.createCustomer(email, name);
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

  async createEphemeralKey(customerId: string): Promise<Stripe.EphemeralKey> {
    return this.stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2025-12-15.clover' },
    );
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
        expand: [
          'latest_invoice.payment_intent',
          'latest_invoice.confirmation_secret',
          'pending_setup_intent',
        ],
      });

      this.logger.log(`Created subscription: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error('Error creating subscription', error);
      throw error;
    }
  }

  extractPaymentIntentFromSubscription(
    subscription: Stripe.Subscription,
  ): Stripe.PaymentIntent {
    const latestInvoice = subscription.latest_invoice;
    if (!latestInvoice || typeof latestInvoice === 'string') {
      throw new InternalServerErrorException(
        'Stripe subscription latest invoice is unavailable',
      );
    }

    // Stripe SDK types for Invoice can differ by API version; payment_intent is present
    // on finalized invoices used in subscription payment flow.
    const latestInvoiceWithPaymentIntent = latestInvoice as Stripe.Invoice & {
      payment_intent?: string | Stripe.PaymentIntent | null;
    };
    const paymentIntent = latestInvoiceWithPaymentIntent.payment_intent;
    if (!paymentIntent || typeof paymentIntent === 'string') {
      throw new InternalServerErrorException(
        'Stripe payment intent is unavailable',
      );
    }

    if (!paymentIntent.client_secret) {
      throw new InternalServerErrorException(
        'Stripe payment intent client secret is unavailable',
      );
    }

    return paymentIntent;
  }

  async extractCheckoutClientSecrets(
    subscription: Stripe.Subscription,
  ): Promise<StripeCheckoutClientSecrets> {
    let paymentIntentClientSecret: string | null = null;
    let setupIntentClientSecret: string | null = null;

    const latestInvoice = subscription.latest_invoice;
    if (latestInvoice && typeof latestInvoice !== 'string') {
      paymentIntentClientSecret =
        await this.extractPaymentIntentClientSecretFromInvoice(latestInvoice);
    }

    const pendingSetupIntent = subscription.pending_setup_intent;
    if (pendingSetupIntent) {
      if (typeof pendingSetupIntent === 'string') {
        const resolvedSetupIntent =
          await this.stripe.setupIntents.retrieve(pendingSetupIntent);
        setupIntentClientSecret = resolvedSetupIntent.client_secret ?? null;
      } else {
        setupIntentClientSecret = pendingSetupIntent.client_secret ?? null;
      }
    }

    return {
      paymentIntentClientSecret,
      setupIntentClientSecret,
    };
  }

  private getLatestInvoiceId(subscription: Stripe.Subscription): string | null {
    const latestInvoice = subscription.latest_invoice;
    if (!latestInvoice) return null;
    if (typeof latestInvoice === 'string') return latestInvoice;
    return latestInvoice.id || null;
  }

  private async extractPaymentIntentClientSecretFromInvoice(
    invoice: Stripe.Invoice,
  ): Promise<string | null> {
    const invoiceWithPaymentIntent = invoice as Stripe.Invoice & {
      payment_intent?: string | Stripe.PaymentIntent | null;
      confirmation_secret?: {
        client_secret?: string | null;
      } | null;
    };

    const paymentIntent = invoiceWithPaymentIntent.payment_intent;
    if (paymentIntent) {
      if (typeof paymentIntent === 'string') {
        const resolvedPaymentIntent =
          await this.stripe.paymentIntents.retrieve(paymentIntent);
        if (resolvedPaymentIntent.client_secret) {
          return resolvedPaymentIntent.client_secret;
        }
      } else if (paymentIntent.client_secret) {
        return paymentIntent.client_secret;
      }
    }

    // Newer Stripe API versions can return invoice.confirmation_secret instead
    // of exposing payment_intent directly in this flow.
    if (invoiceWithPaymentIntent.confirmation_secret?.client_secret) {
      return invoiceWithPaymentIntent.confirmation_secret.client_secret;
    }

    return null;
  }

  private async resolveInvoicePaymentSecret(
    invoiceId: string,
  ): Promise<string | null> {
    const retrievedInvoice = await this.stripe.invoices.retrieve(invoiceId, {
      expand: ['payment_intent', 'confirmation_secret'],
    });
    let paymentIntentClientSecret =
      await this.extractPaymentIntentClientSecretFromInvoice(
        retrievedInvoice as Stripe.Invoice,
      );
    if (paymentIntentClientSecret) {
      return paymentIntentClientSecret;
    }

    // If invoice is still draft, force finalization so Stripe can create
    // the payment object that PaymentSheet needs.
    const invoiceStatus = (retrievedInvoice as Stripe.Invoice).status;
    if (invoiceStatus === 'draft') {
      const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(
        invoiceId,
        {
          auto_advance: true,
          expand: ['payment_intent', 'confirmation_secret'],
        } as Stripe.InvoiceFinalizeInvoiceParams,
      );
      paymentIntentClientSecret =
        await this.extractPaymentIntentClientSecretFromInvoice(
          finalizedInvoice as Stripe.Invoice,
        );
    }

    return paymentIntentClientSecret;
  }

  async getCheckoutClientSecretsWithRetry(
    subscriptionId: string,
    retries: number = 2,
  ): Promise<StripeCheckoutClientSecrets> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const subscription = await this.stripe.subscriptions.retrieve(
        subscriptionId,
        {
          expand: [
            'latest_invoice.payment_intent',
            'latest_invoice.confirmation_secret',
            'pending_setup_intent',
          ],
        },
      );

      const secrets = await this.extractCheckoutClientSecrets(subscription);
      if (
        secrets.paymentIntentClientSecret ||
        secrets.setupIntentClientSecret
      ) {
        return secrets;
      }

      const invoiceId = this.getLatestInvoiceId(subscription);
      if (invoiceId) {
        try {
          const paymentIntentClientSecret =
            await this.resolveInvoicePaymentSecret(invoiceId);
          if (paymentIntentClientSecret) {
            return {
              paymentIntentClientSecret,
              setupIntentClientSecret: secrets.setupIntentClientSecret,
            };
          }
        } catch (error) {
          this.logger.warn(
            `Failed to resolve invoice payment secret for ${invoiceId} on attempt ${attempt + 1}/${retries + 1}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return {
      paymentIntentClientSecret: null,
      setupIntentClientSecret: null,
    };
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }

  resolvePriceIdForPlan(plan: SubscriptionPlan): string {
    const normalizedPlanName = plan.name
      .trim()
      .replace(/\s+/g, '_')
      .toUpperCase();
    const cycle = plan.frequency_in_days >= 360 ? 'YEARLY' : 'MONTHLY';
    const envKey = `STRIPE_PRICE_${normalizedPlanName}_${cycle}`;
    const priceId = this.configService.get<string>(envKey);

    if (!priceId) {
      throw new InternalServerErrorException(
        `${envKey} is not configured for Stripe plan mapping`,
      );
    }

    return priceId;
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
