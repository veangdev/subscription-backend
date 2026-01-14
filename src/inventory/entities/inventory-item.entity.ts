import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 100 })
  product_name: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ length: 100, nullable: true })
  location: string;
}
