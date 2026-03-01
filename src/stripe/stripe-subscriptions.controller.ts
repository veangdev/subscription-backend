import {
  BadRequestException,
  ConflictException,
  Controller,
  InternalServerErrorException,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionPlansService } from '../subscription-plans/subscription-plans.service';
import { SubscribeDto } from '../subscriptions/dto/subscribe.dto';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ConfirmStripeSubscriptionDto } from './dto/confirm-stripe-subscription.dto';
import { CreateStripeCheckoutIntentDto } from './dto/create-stripe-checkout-intent.dto';
import { StripeCheckoutIntentResponseDto } from './dto/stripe-checkout-intent-response.dto';
import { StripeService } from './stripe.service';

@ApiTags('Stripe')
@ApiBearerAuth()
@Controller('stripe/subscriptions')
export class StripeSubscriptionsController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly plansService: SubscriptionPlansService,
  ) {}

  @Post('checkout-intent')
  @ApiOperation({
    summary:
      'Create Stripe subscription + payment intent for selected plan (PaymentSheet)',
  })
  @ApiCreatedResponse({
    description: 'Stripe checkout intent created successfully',
    type: StripeCheckoutIntentResponseDto,
  })
  async createCheckoutIntent(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: CreateStripeCheckoutIntentDto,
  ): Promise<StripeCheckoutIntentResponseDto> {
    const activeSubscription = await this.subscriptionsService.findCurrentByUserId(
      user.id,
    );
    if (activeSubscription) {
      throw new ConflictException('User already has an active subscription');
    }

    const plan = await this.plansService.findOne(dto.plan_id);
    const stripePriceId = this.stripeService.resolvePriceIdForPlan(plan);

    const fallbackName = user.email.split('@')[0] || 'Subscriber';
    const customer = await this.stripeService.findOrCreateCustomer(
      user.email,
      fallbackName,
    );
    const stripeSubscription = await this.stripeService.createSubscription(
      customer.id,
      stripePriceId,
    );
    const { paymentIntentClientSecret, setupIntentClientSecret } =
      await this.stripeService.extractCheckoutClientSecrets(
        stripeSubscription,
      );
    const ephemeralKey = await this.stripeService.createEphemeralKey(
      customer.id,
    );
    if (!ephemeralKey.secret) {
      throw new InternalServerErrorException(
        'Stripe ephemeral key secret is unavailable',
      );
    }
    if (!paymentIntentClientSecret && !setupIntentClientSecret) {
      throw new InternalServerErrorException(
        'Stripe checkout client secret is unavailable',
      );
    }

    return {
      customer_id: customer.id,
      ephemeral_key: ephemeralKey.secret,
      payment_intent_client_secret: paymentIntentClientSecret,
      setup_intent_client_secret: setupIntentClientSecret,
      stripe_subscription_id: stripeSubscription.id,
      publishable_key: this.stripeService.getPublishableKey(),
      stripe_price_id: stripePriceId,
      plan_id: plan.id,
      amount: Number(plan.price),
      currency: 'usd',
    };
  }

  @Post('confirm')
  @ApiOperation({
    summary:
      'Confirm Stripe payment success and create local subscription record',
  })
  @ApiCreatedResponse({
    description: 'Local subscription created successfully',
    type: Subscription,
  })
  async confirmSubscription(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: ConfirmStripeSubscriptionDto,
  ): Promise<Subscription> {
    const plan = await this.plansService.findOne(dto.plan_id);
    const expectedPriceId = this.stripeService.resolvePriceIdForPlan(plan);

    const stripeSubscription = await this.stripeService.getSubscription(
      dto.stripe_subscription_id,
    );

    const actualPriceId = stripeSubscription.items.data[0]?.price?.id;
    if (!actualPriceId || actualPriceId !== expectedPriceId) {
      throw new BadRequestException('Stripe subscription price does not match');
    }

    const validStatuses = new Set(['active', 'trialing']);
    if (!validStatuses.has(stripeSubscription.status)) {
      throw new BadRequestException(
        `Stripe subscription is not active (current status: ${stripeSubscription.status})`,
      );
    }

    const subscribeDto: SubscribeDto = { plan_id: dto.plan_id };
    return this.subscriptionsService.subscribeForCurrentUser(
      user.id,
      subscribeDto,
    );
  }
}
