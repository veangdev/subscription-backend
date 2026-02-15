import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity('shipments')
export class Shipment {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @Column('uuid')
  subscription_id: string;

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
