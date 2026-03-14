import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
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
  private stripe: Stripe | null = null;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      this.logger.warn(
        'STRIPE_SECRET_KEY is not configured. Stripe endpoints will fail until the secret is provided.',
      );
      return;
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
    });
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
    const customer = await this.executeStripeRequest(
      'create a Stripe customer',
      (stripe) =>
        stripe.customers.create({
          email,
          name,
        }),
    );
    this.logger.log(`Created Stripe customer: ${customer.id}`);
    return customer;
  }

  async findOrCreateCustomer(
    email: string,
    name: string,
  ): Promise<Stripe.Customer> {
    const customers = await this.executeStripeRequest(
      'find an existing Stripe customer',
      (stripe) =>
        stripe.customers.list({
          email,
          limit: 1,
        }),
    );

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
    return this.executeStripeRequest('update a Stripe customer', (stripe) =>
      stripe.customers.update(customerId, data),
    );
  }

  /**
   * Delete customer
   */
  async deleteCustomer(customerId: string): Promise<Stripe.DeletedCustomer> {
    return this.executeStripeRequest('delete a Stripe customer', (stripe) =>
      stripe.customers.del(customerId),
    );
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
    const paymentMethod = await this.executeStripeRequest(
      'attach a payment method to a Stripe customer',
      (stripe) =>
        stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        }),
    );

    await this.executeStripeRequest(
      'update Stripe customer default payment method',
      (stripe) =>
        stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        }),
    );

    return paymentMethod;
  }

  /**
   * Get customer payment methods
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await this.executeStripeRequest(
      'list Stripe payment methods',
      (stripe) =>
        stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
        }),
    );
    return paymentMethods.data;
  }

  async createEphemeralKey(customerId: string): Promise<Stripe.EphemeralKey> {
    return this.executeStripeRequest('create a Stripe ephemeral key', (stripe) =>
      stripe.ephemeralKeys.create(
        { customer: customerId },
        { apiVersion: '2025-12-15.clover' },
      ),
    );
  }

  /**
   * Detach payment method
   */
  async detachPaymentMethod(
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    return this.executeStripeRequest('detach a Stripe payment method', (stripe) =>
      stripe.paymentMethods.detach(paymentMethodId),
    );
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
    return this.executeStripeRequest('create a Stripe product', (stripe) =>
      stripe.products.create({
        name,
        description,
      }),
    );
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
    return this.executeStripeRequest('create a Stripe price', (stripe) =>
      stripe.prices.create({
        product: productId,
        unit_amount: Math.round(amount * 100),
        currency: 'usd',
        recurring: {
          interval,
          interval_count: intervalCount,
        },
      }),
    );
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
    const subscription = await this.executeStripeRequest(
      'create a Stripe subscription',
      (stripe) =>
        stripe.subscriptions.create({
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
        }),
    );

    this.logger.log(`Created subscription: ${subscription.id}`);
    return subscription;
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
        const resolvedSetupIntent = await this.executeStripeRequest(
          'retrieve a Stripe setup intent',
          (stripe) => stripe.setupIntents.retrieve(pendingSetupIntent),
        );
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
        const resolvedPaymentIntent = await this.executeStripeRequest(
          'retrieve a Stripe payment intent',
          (stripe) => stripe.paymentIntents.retrieve(paymentIntent),
        );
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
    const retrievedInvoice = await this.executeStripeRequest(
      'retrieve a Stripe invoice',
      (stripe) =>
        stripe.invoices.retrieve(invoiceId, {
          expand: ['payment_intent', 'confirmation_secret'],
        }),
    );
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
      const finalizedInvoice = await this.executeStripeRequest(
        'finalize a Stripe invoice',
        (stripe) =>
          stripe.invoices.finalizeInvoice(
            invoiceId,
            {
              auto_advance: true,
              expand: ['payment_intent', 'confirmation_secret'],
            } as Stripe.InvoiceFinalizeInvoiceParams,
          ),
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
      const subscription = await this.executeStripeRequest(
        'retrieve a Stripe subscription',
        (stripe) =>
          stripe.subscriptions.retrieve(subscriptionId, {
            expand: [
              'latest_invoice.payment_intent',
              'latest_invoice.confirmation_secret',
              'pending_setup_intent',
            ],
          }),
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
    return this.executeStripeRequest('retrieve a Stripe subscription', (stripe) =>
      stripe.subscriptions.retrieve(subscriptionId),
    );
  }

  resolvePriceIdForPlan(plan: SubscriptionPlan): string {
    const normalizedPlanName = plan.name
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
    const cycle = this.resolveStripeCycleKey(plan.frequency_in_days);
    const envKey = `STRIPE_PRICE_${normalizedPlanName}_${cycle}`;
    const priceId = this.configService.get<string>(envKey);

    if (!priceId) {
      throw new ServiceUnavailableException(
        `Stripe price mapping is missing for ${plan.name} (${this.describeBillingFrequency(
          plan.frequency_in_days,
        )}). Expected environment variable: ${envKey}`,
      );
    }

    return priceId;
  }

  private resolveStripeCycleKey(frequencyInDays: number): string {
    if (frequencyInDays >= 360) {
      return 'YEARLY';
    }

    if ([89, 90, 91, 92].includes(frequencyInDays)) {
      return 'EVERY_3_MONTHS';
    }

    if (frequencyInDays === 14) {
      return 'EVERY_2_WEEKS';
    }

    if (frequencyInDays === 7) {
      return 'WEEKLY';
    }

    return 'MONTHLY';
  }

  private describeBillingFrequency(frequencyInDays: number): string {
    if (frequencyInDays >= 360) {
      return 'yearly';
    }

    if ([89, 90, 91, 92].includes(frequencyInDays)) {
      return 'every 3 months';
    }

    if (frequencyInDays === 14) {
      return 'every 2 weeks';
    }

    if (frequencyInDays === 7) {
      return 'weekly';
    }

    return 'monthly';
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
  ): Promise<Stripe.Subscription> {
    const subscription = await this.executeStripeRequest(
      'retrieve a Stripe subscription',
      (stripe) => stripe.subscriptions.retrieve(subscriptionId),
    );

    return this.executeStripeRequest('update a Stripe subscription', (stripe) =>
      stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'always_invoice',
      }),
    );
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return this.executeStripeRequest('pause a Stripe subscription', (stripe) =>
      stripe.subscriptions.update(subscriptionId, {
        pause_collection: {
          behavior: 'keep_as_draft',
        },
      }),
    );
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return this.executeStripeRequest('resume a Stripe subscription', (stripe) =>
      stripe.subscriptions.update(subscriptionId, {
        pause_collection: null,
      }),
    );
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false,
  ): Promise<Stripe.Subscription> {
    if (immediately) {
      return this.executeStripeRequest(
        'cancel a Stripe subscription immediately',
        (stripe) => stripe.subscriptions.cancel(subscriptionId),
      );
    } else {
      // Cancel at end of billing period
      return this.executeStripeRequest(
        'schedule Stripe subscription cancellation',
        (stripe) =>
          stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
          }),
      );
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
    return this.executeStripeRequest('create a Stripe payment intent', (stripe) =>
      stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        customer: customerId,
        description,
        automatic_payment_methods: {
          enabled: true,
        },
      }),
    );
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    return this.executeStripeRequest('confirm a Stripe payment intent', (stripe) =>
      stripe.paymentIntents.confirm(paymentIntentId),
    );
  }

  // ============================================
  // Invoices
  // ============================================

  /**
   * Get customer invoices
   */
  async getInvoices(customerId: string): Promise<Stripe.Invoice[]> {
    const invoices = await this.executeStripeRequest(
      'list Stripe invoices',
      (stripe) =>
        stripe.invoices.list({
          customer: customerId,
          limit: 100,
        }),
    );
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

    return this.executeStripeRequest('create a Stripe refund', (stripe) =>
      stripe.refunds.create(refundData),
    );
  }

  private getStripeClient(): Stripe {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        'STRIPE_SECRET_KEY is not configured',
      );
    }

    return this.stripe;
  }

  private async executeStripeRequest<T>(
    action: string,
    request: (stripe: Stripe) => Promise<T>,
  ): Promise<T> {
    const stripe = this.getStripeClient();

    try {
      return await request(stripe);
    } catch (error) {
      this.logger.error(
        `Failed to ${action}: ${this.getStripeErrorMessage(error)}`,
      );
      throw this.mapStripeError(error);
    }
  }

  private mapStripeError(error: unknown): Error {
    const message = this.getStripeErrorMessage(error);
    const type = this.getStripeErrorType(error);
    const normalizedMessage = message.toLowerCase();

    if (type === 'StripeAuthenticationError') {
      return new ServiceUnavailableException(
        'Stripe secret key is invalid or missing',
      );
    }

    if (
      type === 'StripeConnectionError' ||
      type === 'StripeRateLimitError' ||
      type === 'StripeAPIError'
    ) {
      return new ServiceUnavailableException(
        'Stripe is temporarily unavailable. Please try again.',
      );
    }

    if (normalizedMessage.includes('no such price')) {
      return new ServiceUnavailableException(
        'Stripe price mapping is invalid for this plan. Check the configured Stripe price ID.',
      );
    }

    if (type === 'StripeCardError' || type === 'StripeInvalidRequestError') {
      return new BadRequestException(message);
    }

    return new InternalServerErrorException(message || 'Stripe request failed');
  }

  private getStripeErrorMessage(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Stripe request failed';
  }

  private getStripeErrorType(error: unknown): string | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      typeof error.type === 'string'
    ) {
      return error.type;
    }

    return null;
  }
}
