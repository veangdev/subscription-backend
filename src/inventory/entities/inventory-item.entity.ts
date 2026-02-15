import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('inventory_items')
export class InventoryItem {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  product_name: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ length: 100, nullable: true })
  location: string;
}
