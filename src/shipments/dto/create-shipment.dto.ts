import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000', description: 'Subscription ID' })
  @IsNotEmpty()
  @IsUUID()
  subscription_id: string;

  @ApiProperty({ example: '2025-02-15', description: 'Shipment date (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  shipment_date: string;

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'SHIPPED', 'DELIVERED'] })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiProperty({ example: 'TRK-123456789', required: false })
  @IsOptional()
  @IsString()
  tracking_number?: string;
}
