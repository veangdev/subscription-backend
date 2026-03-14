import {
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';

describe('StripeService', () => {
  const buildConfigService = (values: Record<string, string | undefined>) =>
    ({
      get: jest.fn((key: string) => values[key]),
    }) as unknown as ConfigService;

  it('is defined', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: buildConfigService({
            STRIPE_SECRET_KEY: 'sk_test_example',
            STRIPE_PUBLISHABLE_KEY: 'pk_test_example',
          }),
        },
      ],
    }).compile();

    expect(module.get(StripeService)).toBeDefined();
  });

  it('fails clearly when STRIPE_SECRET_KEY is missing', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: buildConfigService({
            STRIPE_PUBLISHABLE_KEY: 'pk_test_example',
          }),
        },
      ],
    }).compile();

    const service = module.get(StripeService);

    await expect(
      service.createSubscription('cus_123', 'price_123'),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('maps Stripe invalid price errors to a readable service exception', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: buildConfigService({
            STRIPE_SECRET_KEY: 'sk_test_example',
            STRIPE_PUBLISHABLE_KEY: 'pk_test_example',
          }),
        },
      ],
    }).compile();

    const service = module.get(StripeService);
    (service as any).stripe = {
      subscriptions: {
        create: jest.fn().mockRejectedValue({
          type: 'StripeInvalidRequestError',
          message: 'No such price: price_bad',
        }),
      },
    };

    await expect(
      service.createSubscription('cus_123', 'price_bad'),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('requires STRIPE_PUBLISHABLE_KEY when building checkout payloads', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: buildConfigService({
            STRIPE_SECRET_KEY: 'sk_test_example',
          }),
        },
      ],
    }).compile();

    const service = module.get(StripeService);

    expect(() => service.getPublishableKey()).toThrow(
      InternalServerErrorException,
    );
  });
});
