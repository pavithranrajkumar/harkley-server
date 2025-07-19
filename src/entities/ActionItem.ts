import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Meeting } from './Meeting';

@Entity('action_items')
export class ActionItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'meeting_id' })
  meetingId!: string;

  @Column({ name: 'speaker_number', nullable: true })
  speakerNumber!: number;

  @Column({ type: 'text' })
  description!: string;

  @Column({ nullable: true })
  assignee!: string;

  @Column({ name: 'due_date', nullable: true })
  dueDate!: Date;

  @Column({ default: 'medium' })
  priority!: string;

  @Column({ default: 'pending' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Meeting, (meeting) => meeting.actionItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meeting_id' })
  meeting!: Meeting;
}
