import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Transcription } from './Transcription';
import { ActionItem } from './ActionItem';

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  duration!: number;

  @Column({ nullable: true })
  file_size!: number;

  @Column()
  file_path!: string;

  @Column({ nullable: true })
  summary!: string;

  @Column({ default: 'active' })
  status!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Transcription, (transcription) => transcription.meeting, { cascade: true })
  transcriptions!: Transcription[];

  @OneToMany(() => ActionItem, (actionItem) => actionItem.meeting, { cascade: true })
  actionItems!: ActionItem[];
}
