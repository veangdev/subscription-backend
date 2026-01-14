import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 50 })
  type: string; // REVENUE, CHURN, ACTIVE_SUBSCRIBERS

  @Column({ type: 'text', nullable: true })
  data: string; // JSON or text

  @CreateDateColumn()
  created_at: Date;
}
