import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;
  @Column({ nullable: true }) user_id: number;
  @Column() action: string;
  @Column({ nullable: true }) table_name: string;
  @Column({ nullable: true }) record_id: number;
  @Column({ type: 'json', nullable: true }) old_value: any;
  @Column({ type: 'json', nullable: true }) new_value: any;
  @Column({ nullable: true }) ip_address: string;
  @CreateDateColumn() created_at: Date;
}
