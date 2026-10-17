import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column() role_id: number;
  @ManyToOne(() => Role) @JoinColumn({ name: 'role_id' }) role: Role;
  @Column() full_name: string;
  @Column() email: string;
  @Column() password_hash: string;
  @Column({ nullable: true }) phone: string;
  @Column({ type: 'enum', enum: ['active', 'disabled'], default: 'active' }) status: string;
  @Column({ type: 'timestamp', nullable: true }) last_login: Date;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
