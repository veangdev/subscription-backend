import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class ProductDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Lavender Foam Cleanser' })
  name: string;

  @ApiPropertyOptional({ example: 'A gentle foaming cleanser with lavender extract.', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ example: 'Wellness', nullable: true })
  category: string | null;

  @ApiProperty({ example: 4.99 })
  price: number;

  @ApiPropertyOptional({
    example: 'https://storage.googleapis.com/box-images/products/product-id/cover.jpg',
    nullable: true,
  })
  image_url: string | null;

  @ApiPropertyOptional({ example: 'LFC-001', nullable: true })
  sku: string | null;

  @ApiPropertyOptional({ example: 0.25, nullable: true })
  weight_kg: number | null;

  @ApiPropertyOptional({ example: '10x5x3 cm', nullable: true })
  dimensions: string | null;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Lavender Foam Cleanser' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'A gentle foaming cleanser with lavender extract.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Wellness' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 4.99 })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ example: 'LFC-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 0.25 })
  @IsOptional()
  @IsNumber()
  weight_kg?: number;

  @ApiPropertyOptional({ example: '10x5x3 cm' })
  @IsOptional()
  @IsString()
  dimensions?: string;
}

export class AddProductsToPlanDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    description: 'UUIDs of products to add to the plan',
  })
  @IsUUID('all', { each: true })
  product_ids: string[];
}

export class RemoveProductsFromPlanDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    description: 'UUIDs of products to remove from the plan',
  })
  @IsUUID('all', { each: true })
  product_ids: string[];
}
