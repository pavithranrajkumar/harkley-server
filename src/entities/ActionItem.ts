import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Meeting } from './Meeting';

@Entity('action_items')
@Index('IDX_action_items_meeting_id', ['meetingId'])
@Index('IDX_action_items_status', ['status'])
@Index('IDX_action_items_priority', ['priority'])
export class ActionItem extends BaseEntity {
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

  @ManyToOne(() => Meeting, (meeting) => meeting.actionItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meeting_id' })
  meeting!: Meeting;
}
