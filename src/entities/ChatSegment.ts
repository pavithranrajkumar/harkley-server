import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Transcription } from './Transcription';

@Entity('chat_segments')
export class ChatSegment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Transcription, (transcription) => transcription.chatSegments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transcription_id' })
  transcription!: Transcription;
}
