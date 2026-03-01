import { ApiProperty } from '@nestjs/swagger';

export class StripeCheckoutIntentResponseDto {
  @ApiProperty({ example: 'cus_RfR1p2abc12345' })
  customer_id: string;

  @ApiProperty({ example: 'ek_test_abc123...' })
  ephemeral_key: string;

  @ApiProperty({ example: 'pi_3RrA..._secret_abc123...' })
  payment_intent_client_secret: string;

  @ApiProperty({ example: 'sub_1Rr9xPAQFYxxyZZYabc12345' })
  stripe_subscription_id: string;

  @ApiProperty({ example: 'pk_test_51T6A...' })
  publishable_key: string;

  @ApiProperty({ example: 'price_1Rr9uQAQFYxxyZZYabc12345' })
  stripe_price_id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  plan_id: string;

  @ApiProperty({ example: 9 })
  amount: number;

  @ApiProperty({ example: 'usd' })
  currency: string;
}
