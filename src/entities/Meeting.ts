import { Entity, Column, OneToMany, OneToOne, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Transcription } from './Transcription';
import { ActionItem } from './ActionItem';

@Entity('meetings')
@Index('IDX_meetings_user_id', ['userId'])
@Index('IDX_meetings_user_status', ['userId', 'status'])
@Index('IDX_meetings_created_at', ['createdAt'])
@Index('IDX_meetings_user_created', ['userId', 'createdAt'])
export class Meeting extends BaseEntity {
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

  @Column({ default: 'processing' })
  status!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @OneToOne(() => Transcription, (transcription) => transcription.meeting, { cascade: true })
  transcription!: Transcription;

  @OneToMany(() => ActionItem, (actionItem) => actionItem.meeting, { cascade: true })
  actionItems!: ActionItem[];
}
