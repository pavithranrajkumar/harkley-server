import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Transcription } from './Transcription';

@Entity('chat_segments')
export class ChatSegment extends BaseEntity {
  @Column({ name: 'transcription_id' })
  transcriptionId!: string;

  @Column({ name: 'speaker_number' })
  speakerNumber!: number;

  @Column({ type: 'text' })
  text!: string;

  @Column({ name: 'start_time' })
  startTime!: number;

  @Column({ name: 'end_time' })
  endTime!: number;

  @Column({ nullable: true })
  confidence!: number;

  @ManyToOne(() => Transcription, (transcription) => transcription.chatSegments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transcription_id' })
  transcription!: Transcription;
}
