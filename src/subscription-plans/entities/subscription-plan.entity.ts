import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 50 })
  name: string; // Basic, Premium, Deluxe

  @Column({ type: 'int' })
  frequency_in_days: number; // 7, 30, 90

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  // Relations
  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];
}
