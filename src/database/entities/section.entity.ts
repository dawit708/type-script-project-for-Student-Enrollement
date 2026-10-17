import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Course } from './course.entity';
import { Teacher } from './teacher.entity';
import { Semester } from './semester.entity';

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn() id: number;
  @Column() course_id: number;
  @ManyToOne(() => Course) @JoinColumn({ name: 'course_id' }) course: Course;
  @Column({ nullable: true }) teacher_id: number;
  @ManyToOne(() => Teacher) @JoinColumn({ name: 'teacher_id' }) teacher: Teacher;
  @Column() semester_id: number;
  @ManyToOne(() => Semester) @JoinColumn({ name: 'semester_id' }) semester: Semester;
  @Column() section_name: string;
  @Column({ nullable: true }) room: string;
  @Column({ type: 'enum', enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }) day_of_week: string;
  @Column({ type: 'time' }) start_time: string;
  @Column({ type: 'time' }) end_time: string;
  @Column({ default: 40 }) capacity: number;
  @Column({ default: 0 }) enrolled_count: number;
  @CreateDateColumn() created_at: Date;
}
