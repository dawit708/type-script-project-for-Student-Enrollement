import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn() id: number;
  @Column() posted_by: number;
  @Column() title: string;
  @Column({ type: 'text' }) message: string;
  @Column({ type: 'enum', enum: ['all', 'admin', 'registrar', 'teacher', 'student'], default: 'all' }) target_role: string;
  @Column({ nullable: true }) section_id: number;
  @CreateDateColumn() created_at: Date;
}
