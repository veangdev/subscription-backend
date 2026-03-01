import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ConfirmStripeSubscriptionDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Selected subscription plan ID',
  })
  @IsNotEmpty()
  @IsUUID()
  plan_id: string;

  @ApiProperty({
    type: String,
    example: 'sub_1Rr9xPAQFYxxyZZYabc12345',
    description: 'Stripe subscription ID returned from checkout-intent API',
  })
  @IsNotEmpty()
  @IsString()
  stripe_subscription_id: string;
}
