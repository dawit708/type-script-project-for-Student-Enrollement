import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Department } from './department.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn() id: number;
  @Column() department_id: number;
  @ManyToOne(() => Department) @JoinColumn({ name: 'department_id' }) department: Department;
  @Column() code: string;
  @Column() name: string;
  @Column({ default: 3 }) credit_hours: number;
  @Column({ default: 1 }) year_level: number;
  @Column({ default: 1 }) semester_no: number;
  @Column({ type: 'enum', enum: ['core', 'optional'], default: 'core' }) course_type: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'boolean', default: true }) is_active: boolean;
  @CreateDateColumn() created_at: Date;
}
