import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({
    example: 'The Wellness Box',
    description: 'Curated box name shown to subscribers',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 30,
    description: 'Delivery cadence in days (for example 7 weekly, 30 monthly, 365 yearly)',
  })
  @IsNotEmpty()
  @IsNumber()
  frequency_in_days: number;

  @ApiProperty({ example: 19.0, description: 'Recurring price for this box + cadence' })
  @IsNotEmpty()
  @IsNumber()
  price: number;
}
