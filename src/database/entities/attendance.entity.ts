import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Enrollment } from './enrollment.entity';

@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn() id: number;
  @Column() enrollment_id: number;
  @ManyToOne(() => Enrollment) @JoinColumn({ name: 'enrollment_id' }) enrollment: Enrollment;
  @Column({ type: 'date' }) attendance_date: string;
  @Column({ type: 'enum', enum: ['present', 'absent', 'late', 'excused'], default: 'present' }) status: string;
  @Column({ nullable: true }) remark: string;
  @CreateDateColumn() created_at: Date;
}
