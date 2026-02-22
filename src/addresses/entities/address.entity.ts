import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('addresses')
export class Address {
  @ApiProperty({ type: String, format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @Column('uuid')
  user_id: string;

  @ApiProperty({ example: 'male', enum: ['male', 'female'] })
  @Column({ length: 10 })
  gender: string;

  @ApiProperty({ example: '+1234567890' })
  @Column({ length: 20 })
  phone: string;

  @ApiProperty({ example: '123 Main St, City, Country' })
  @Column({ type: 'text' })
  address: string;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
