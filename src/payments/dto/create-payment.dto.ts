import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000', description: 'Subscription ID' })
  @IsNotEmpty()
  @IsUUID()
  subscription_id: string;

  @ApiProperty({ example: 29.99, description: 'Payment amount' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'PENDING', enum: ['SUCCESS', 'FAILED', 'PENDING'] })
  @IsNotEmpty()
  @IsString()
  payment_status: string;
}
