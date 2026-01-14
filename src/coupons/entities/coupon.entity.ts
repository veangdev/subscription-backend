import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  discount: number; // percentage

  @Column({ type: 'date' })
  expiry_date: Date;
}
