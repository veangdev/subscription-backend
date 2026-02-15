import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'Organic Coffee Beans 500g' })
  @IsNotEmpty()
  @IsString()
  product_name: string;

  @ApiProperty({ example: 100, description: 'Stock quantity' })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 'Warehouse A', required: false })
  @IsOptional()
  @IsString()
  location?: string;
}
