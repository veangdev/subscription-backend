import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';

@Entity('reports')
export class Report {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  type: string; // REVENUE, CHURN, ACTIVE_SUBSCRIBERS

  @Column({ type: 'text', nullable: true })
  data: string; // JSON or text

  @CreateDateColumn()
  created_at: Date;
}
