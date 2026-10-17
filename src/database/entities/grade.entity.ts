import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Enrollment } from './enrollment.entity';

@Entity('grades')
export class Grade {
  @PrimaryGeneratedColumn() id: number;
  @Column() enrollment_id: number;
  @OneToOne(() => Enrollment) @JoinColumn({ name: 'enrollment_id' }) enrollment: Enrollment;
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) assignment_mark: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) midterm_mark: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) final_mark: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) total_mark: number;
  @Column({ nullable: true }) letter_grade: string;
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true }) grade_point: number;
  @Column({ nullable: true }) entered_by: number;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
