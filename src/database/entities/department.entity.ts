import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column() code: string;
  @Column({ nullable: true }) description: string;
  @CreateDateColumn() created_at: Date;
}
