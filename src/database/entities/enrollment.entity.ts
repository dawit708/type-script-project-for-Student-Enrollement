import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Student } from './student.entity';
import { Section } from './section.entity';

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn() id: number;
  @Column() student_id: number;
  @ManyToOne(() => Student) @JoinColumn({ name: 'student_id' }) student: Student;
  @Column() section_id: number;
  @ManyToOne(() => Section) @JoinColumn({ name: 'section_id' }) section: Section;
  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected', 'dropped'], default: 'pending' }) status: string;
  @Column({ nullable: true }) reviewed_by: number;
  @Column({ nullable: true }) reject_reason: string;
  @CreateDateColumn() enrolled_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
