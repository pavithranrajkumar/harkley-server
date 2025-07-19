import { Entity, Column, OneToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Meeting } from './Meeting';
import { ChatSegment } from './ChatSegment';

@Entity('transcriptions')
@Index('IDX_transcriptions_meeting_id', ['meetingId'])
export class Transcription extends BaseEntity {
  @Column({ name: 'meeting_id' })
  meetingId!: string;

  @Column({ name: 'full_text', type: 'text' })
  fullText!: string;

  @Column({ nullable: true })
  summary!: string;

  @Column({ nullable: true })
  confidence!: number;

  @Column({ default: 'en' })
  language!: string;

  @Column({ name: 'word_count', nullable: true })
  wordCount!: number;

  @OneToOne(() => Meeting, (meeting) => meeting.transcription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meeting_id' })
  meeting!: Meeting;

  @OneToMany(() => ChatSegment, (segment) => segment.transcription, { cascade: true })
  chatSegments!: ChatSegment[];
}
