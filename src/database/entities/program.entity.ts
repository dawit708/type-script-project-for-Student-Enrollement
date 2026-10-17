import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Department } from './department.entity';

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn() id: number;
  @Column() department_id: number;
  @ManyToOne(() => Department) @JoinColumn({ name: 'department_id' }) department: Department;
  @Column() name: string;
  @Column() code: string;
  @Column({ default: 4 }) duration_years: number;
  @Column({ type: 'enum', enum: ['diploma', 'bachelor', 'master', 'phd'], default: 'bachelor' }) degree_level: string;
  @CreateDateColumn() created_at: Date;
}
