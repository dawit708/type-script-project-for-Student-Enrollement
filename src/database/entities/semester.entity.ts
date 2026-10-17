import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('semesters')
export class Semester {
  @PrimaryGeneratedColumn() id: number;
  @Column() academic_year: string;
  @Column({ type: 'enum', enum: ['1', '2', 'summer'] }) term: string;
  @Column({ type: 'date' }) start_date: string;
  @Column({ type: 'date' }) end_date: string;
  @Column({ type: 'date', nullable: true }) enrollment_start: string;
  @Column({ type: 'date', nullable: true }) enrollment_end: string;
  @Column({ type: 'boolean', default: false }) is_enrollment_open: boolean;
  @Column({ type: 'boolean', default: false }) is_current: boolean;
  @CreateDateColumn() created_at: Date;
}
