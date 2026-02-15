import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
