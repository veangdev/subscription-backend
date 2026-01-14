import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint' })
  subscription_id: number;

  @Column({ type: 'date' })
  shipment_date: Date;

  @Column({ length: 20 })
  status: string; // PENDING, SHIPPED, DELIVERED

  @Column({ length: 50, nullable: true })
  tracking_number: string;

  // Relations
  @ManyToOne(() => Subscription, (subscription) => subscription.shipments)
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;
}
