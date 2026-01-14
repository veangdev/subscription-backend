import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone_number: string;

  @Column({ length: 100 })
  @Exclude() // Don't expose password in API responses
  password: string; // Not in schema but needed for authentication

  @Column({ length: 20 })
  role: string; // 'Admin' or 'Subscriber'

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];
}
