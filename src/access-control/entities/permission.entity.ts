import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from './role.entity';

@Entity('permissions')
@Unique(['key'])
export class Permission {
  @ApiProperty({ type: String, format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'users.view' })
  @Column({ length: 120 })
  key: string;

  @ApiProperty({ example: 'View users' })
  @Column({ length: 120 })
  label: string;

  @ApiProperty({ example: 'User Management' })
  @Column({ length: 120 })
  group_name: string;

  @ApiProperty({ example: 'View user accounts and directory details.' })
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @ApiProperty({ example: 10 })
  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
