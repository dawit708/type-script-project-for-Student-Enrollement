import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from './course.entity';

@Entity('course_prerequisites')
export class CoursePrerequisite {
  @PrimaryGeneratedColumn() id: number;
  @Column() course_id: number;
  @ManyToOne(() => Course) @JoinColumn({ name: 'course_id' }) course: Course;
  @Column() prerequisite_id: number;
  @ManyToOne(() => Course) @JoinColumn({ name: 'prerequisite_id' }) prerequisite: Course;
}
