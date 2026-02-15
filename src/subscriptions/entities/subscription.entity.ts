import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Shipment } from '../../shipments/entities/shipment.entity';
import { SubscriptionPlan } from '../../subscription-plans/entities/subscription-plan.entity';

@Entity('subscriptions')
export class Subscription {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @Column('uuid')
  user_id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @Column('uuid')
  plan_id: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ length: 20 })
  status: string; // ACTIVE, PAUSED, CANCELLED

  // Relations
  @ManyToOne(() => User, (user) => user.subscriptions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @OneToMany(() => Payment, (payment) => payment.subscription)
  payments: Payment[];

  @OneToMany(() => Shipment, (shipment) => shipment.subscription)
  shipments: Shipment[];
}
