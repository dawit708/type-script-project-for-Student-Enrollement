import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Student } from './student.entity';
import { Semester } from './semester.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn() id: number;
  @Column() student_id: number;
  @ManyToOne(() => Student) @JoinColumn({ name: 'student_id' }) student: Student;
  @Column() semester_id: number;
  @ManyToOne(() => Semester) @JoinColumn({ name: 'semester_id' }) semester: Semester;
  @Column({ type: 'decimal', precision: 10, scale: 2 }) amount: number;
  @Column({ type: 'enum', enum: ['cash', 'bank', 'mobile', 'online'], default: 'cash' }) method: string;
  @Column({ nullable: true }) reference_no: string;
  @Column({ type: 'enum', enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' }) status: string;
  @Column({ nullable: true }) recorded_by: number;
  @Column({ type: 'timestamp', nullable: true }) paid_at: Date;
  @CreateDateColumn() created_at: Date;
}
