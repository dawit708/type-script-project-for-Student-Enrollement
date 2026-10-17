import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Program } from './program.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn() id: number;
  @Column() user_id: number;
  @OneToOne(() => User) @JoinColumn({ name: 'user_id' }) user: User;
  @Column() program_id: number;
  @ManyToOne(() => Program) @JoinColumn({ name: 'program_id' }) program: Program;
  @Column() student_no: string;
  @Column({ type: 'enum', enum: ['male', 'female', 'other'], nullable: true }) gender: string;
  @Column({ type: 'date', nullable: true }) date_of_birth: string;
  @Column({ nullable: true }) address: string;
  @Column({ nullable: true }) guardian_name: string;
  @Column({ nullable: true }) guardian_phone: string;
  @Column({ type: 'date', nullable: true }) admission_date: string;
  @Column({ default: 1 }) current_year: number;
  @Column({ default: 1 }) current_semester: number;
  @Column({ type: 'enum', enum: ['active', 'graduated', 'dropped', 'suspended'], default: 'active' }) status: string;
  @CreateDateColumn() created_at: Date;
}
