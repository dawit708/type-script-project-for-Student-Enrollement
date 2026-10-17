import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn() id: number;
  @Column() setting_key: string;
  @Column() setting_value: string;
  @Column({ nullable: true }) description: string;
  @UpdateDateColumn() updated_at: Date;
}
