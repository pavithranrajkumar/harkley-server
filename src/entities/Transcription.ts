import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Meeting } from './Meeting';
import { ChatSegment } from './ChatSegment';

@Entity('transcriptions')
export class Transcription extends BaseEntity {
  @Column({ name: 'meeting_id' })
  meetingId!: string;

  @Column({ default: 'completed' })
  status!: string;

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

  @ManyToOne(() => Meeting, (meeting) => meeting.transcriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meeting_id' })
  meeting!: Meeting;

  @OneToMany(() => ChatSegment, (segment) => segment.transcription, { cascade: true })
  chatSegments!: ChatSegment[];
}
