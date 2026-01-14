import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint' })
  subscription_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 20 })
  payment_status: string; // SUCCESS, FAILED, PENDING

  @CreateDateColumn()
  payment_date: Date;

  // Relations
  @ManyToOne(() => Subscription, (subscription) => subscription.payments)
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;
}
