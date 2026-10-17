import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn() id: number;
  @Column() user_id: number;
  @Column() title: string;
  @Column() message: string;
  @Column({ type: 'boolean', default: false }) is_read: boolean;
  @CreateDateColumn() created_at: Date;
}
