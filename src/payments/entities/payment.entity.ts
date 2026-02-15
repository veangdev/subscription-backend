import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity('payments')
export class Payment {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @Column('uuid')
  subscription_id: string;

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
