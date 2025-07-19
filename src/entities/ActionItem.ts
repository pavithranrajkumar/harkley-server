import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Meeting } from './Meeting';

@Entity('action_items')
@Index('IDX_action_items_meeting_id', ['meetingId'])
@Index('IDX_action_items_status', ['status'])
@Index('IDX_action_items_priority', ['priority'])
@Index('IDX_action_items_speaker', ['speaker'])
@Index('IDX_action_items_created_by', ['createdBy'])
export class ActionItem extends BaseEntity {
  @Column({ name: 'meeting_id' })
  meetingId!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ nullable: true })
  speaker!: string;

  @Column({ name: 'due_date', nullable: true })
  dueDate!: Date;

  @Column({ default: 'medium' })
  priority!: string;

  @Column({ default: 'pending' })
  status!: string;

  @Column({ name: 'created_by' })
  createdBy!: string;

  @ManyToOne(() => Meeting, (meeting) => meeting.actionItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meeting_id' })
  meeting!: Meeting;
}
