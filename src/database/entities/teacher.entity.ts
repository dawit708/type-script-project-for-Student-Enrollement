import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Department } from './department.entity';

@Entity('teachers')
export class Teacher {
  @PrimaryGeneratedColumn() id: number;
  @Column() user_id: number;
  @OneToOne(() => User) @JoinColumn({ name: 'user_id' }) user: User;
  @Column() department_id: number;
  @ManyToOne(() => Department) @JoinColumn({ name: 'department_id' }) department: Department;
  @Column() employee_no: string;
  @Column({ nullable: true }) qualification: string;
  @Column({ type: 'date', nullable: true }) hire_date: string;
  @CreateDateColumn() created_at: Date;
}
