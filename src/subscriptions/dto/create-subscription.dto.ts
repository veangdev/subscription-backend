import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000', description: 'User ID' })
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001', description: 'Subscription plan ID' })
  @IsNotEmpty()
  @IsUUID()
  plan_id: string;

  @ApiProperty({ example: '2025-01-01', description: 'Start date (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @ApiProperty({ example: '2025-12-31', required: false, description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'PAUSED', 'CANCELLED'] })
  @IsNotEmpty()
  @IsString()
  status: string;
}
