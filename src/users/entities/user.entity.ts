import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Role } from '../../access-control/entities/role.entity';

@Entity('users')
export class User {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  username: string | null; // For admin users only

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone_number: string | null;

  @Column({ length: 100 })
  @Exclude() // Don't expose password in API responses
  password: string; // Not in schema but needed for authentication

  @Column({ length: 20 })
  role: string; // 'Admin' or 'Subscriber'

  @ApiProperty({ example: 'Active', enum: ['Active', 'Inactive'] })
  @Column({ length: 20, default: 'Active' })
  status: string;

  @ApiPropertyOptional({
    example: 'https://storage.googleapis.com/box-images/users/user-id/profile/avatar.jpg',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  profile_image_url: string | null;

  @ApiPropertyOptional({
    example: 'dGh3...xyz',
    description: 'Firebase Cloud Messaging token for push notifications',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  fcm_token: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @ApiPropertyOptional({ type: () => Role })
  @ManyToOne(() => Role, (roleDetails) => roleDetails.users, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'role', referencedColumnName: 'name' })
  role_details?: Role | null;
}
