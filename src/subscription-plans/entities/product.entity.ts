import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlan } from './subscription-plan.entity';

@Entity('products')
export class Product {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Lavender Foam Cleanser' })
  @Column({ length: 150 })
  name: string;

  @ApiPropertyOptional({ example: 'A gentle foaming cleanser with lavender extract.', nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ example: 'Wellness', nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @ApiProperty({ example: 4.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiPropertyOptional({
    example: 'https://storage.googleapis.com/box-images/products/product-id/cover.jpg',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  image_url: string | null;

  @ApiPropertyOptional({ example: 'LFC-001', nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string | null;

  @ApiPropertyOptional({ example: 0.25, nullable: true })
  @Column({ type: 'decimal', precision: 8, scale: 3, nullable: true })
  weight_kg: number | null;

  @ApiPropertyOptional({ example: '10x5x3 cm', nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  dimensions: string | null;

  // Relations
  @ManyToMany(() => SubscriptionPlan, (plan) => plan.products)
  plans: SubscriptionPlan[];
}
