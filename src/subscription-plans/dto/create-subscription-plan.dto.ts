import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Premium', description: 'Plan name (Basic, Premium, Deluxe)' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 30, description: 'Delivery frequency in days (7, 30, 90)' })
  @IsNotEmpty()
  @IsNumber()
  frequency_in_days: number;

  @ApiProperty({ example: 29.99, description: 'Plan price' })
  @IsNotEmpty()
  @IsNumber()
  price: number;
}
