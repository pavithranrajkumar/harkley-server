import { createClient, DeepgramClient, DeepgramResponse, SyncPrerecordedResponse } from '@deepgram/sdk';
import { env } from '../config/env';
import { AppDataSource } from '../config/ormconfig';
import { Transcription } from '../entities/Transcription';
import { ChatSegment } from '../entities/ChatSegment';
import { Repository } from 'typeorm';

export class TranscriptionService {
  private deepgram: DeepgramClient;
  private transcriptionRepository: Repository<Transcription>;
  private chatSegmentRepository: Repository<ChatSegment>;

  constructor() {
    this.deepgram = createClient(env.DEEPGRAM_API_KEY);
    this.transcriptionRepository = AppDataSource.getRepository(Transcription);
    this.chatSegmentRepository = AppDataSource.getRepository(ChatSegment);
  }

  /**
   * Start transcription for a meeting
   */
  async startTranscription(meetingId: string, audioUrl: string): Promise<DeepgramResponse<SyncPrerecordedResponse>> {
    try {
      console.log(`🎙️ Starting transcription for meeting: ${meetingId}`);

      const response = await this.deepgram.listen.prerecorded.transcribeUrl(
        {
          url: audioUrl,
        },
        {
          model: 'nova-3',
          smart_format: true,
          diarize: true,
          utterances: true,
          punctuate: true,
          summarize: 'v2',
        }
      );

      console.log(`✅ Transcription completed for meeting: ${meetingId}`);
      return response;
    } catch (error) {
      console.error('Failed to start transcription:', error);
      throw error;
    }
  }

  /**
   * Get transcription for a meeting with chat segments included
   */
  async getTranscriptionByMeeting(meetingId: string): Promise<Transcription | null> {
    const transcription = await this.transcriptionRepository.findOne({
      where: { meetingId },
      relations: ['chatSegments'],
      order: {
        chatSegments: {
          startTime: 'ASC',
        },
      },
    });

    return transcription;
  }

  /**
   * Get a single transcription by ID with chat segments included
   */
  async getTranscriptionById(transcriptionId: string): Promise<Transcription | null> {
    const transcription = await this.transcriptionRepository.findOne({
      where: { id: transcriptionId },
    });

    if (!transcription) {
      return null;
    }

    // Always load chat segments
    const chatSegments = await this.chatSegmentRepository.find({
      where: { transcriptionId },
      order: { startTime: 'ASC' },
    });

    transcription.chatSegments = chatSegments;

    return transcription;
  }

  /**
   * Get transcription statistics for a meeting
   */
  async getTranscriptionStats(meetingId: string): Promise<{
    hasTranscription: boolean;
    wordCount: number;
    confidence: number;
    status: string;
  }> {
    const transcription = await this.transcriptionRepository.findOne({
      where: { meetingId },
      select: ['wordCount', 'confidence', 'status'],
    });

    return {
      hasTranscription: !!transcription,
      wordCount: transcription?.wordCount || 0,
      confidence: transcription?.confidence || 0,
      status: transcription?.status || 'not_found',
    };
  }

  /**
   * Get chat segments for a transcription
   */
  async getChatSegmentsByTranscription(
    transcriptionId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{
    chatSegments: ChatSegment[];
    total: number;
  }> {
    const { limit = 100, offset = 0 } = options;

    const [chatSegments, total] = await this.chatSegmentRepository.findAndCount({
      where: { transcriptionId },
      order: { startTime: 'ASC' },
      take: limit,
      skip: offset,
    });

    return {
      chatSegments,
      total,
    };
  }

  /**
   * Process transcription results and save to database
   */
  async processTranscriptionResults(
    meetingId: string,
    transcriptionResponse: DeepgramResponse<SyncPrerecordedResponse>
  ): Promise<{
    transcript: string;
    chatSegments: ChatSegment[];
    duration: number;
  }> {
    try {
      const { results, metadata } = transcriptionResponse.result!;
      const { channels, summary, utterances } = results!;
      const { transcript, words, confidence } = channels[0].alternatives[0];

      // Calculate word count
      const wordCount = words.length;

      // Save transcription to database
      const transcriptionRecord = await this.transcriptionRepository.save({
        meetingId: meetingId,
        status: 'completed',
        fullText: transcript,
        confidence: Math.round(confidence * 100),
        language: 'en',
        wordCount: wordCount,
        summary: summary?.short,
      });

      // Save chat segments (utterances with speaker info)
      let chatSegments: ChatSegment[] = [];
      if (utterances && utterances.length > 0) {
        chatSegments = utterances.map(
          (utterance) =>
            ({
              transcriptionId: transcriptionRecord.id,
              speakerNumber: utterance.speaker || 0,
              text: utterance.transcript,
              startTime: Math.round(utterance.start * 1000), // Convert to milliseconds
              endTime: Math.round(utterance.end * 1000),
              confidence: Math.round(utterance.confidence * 100),
            } as ChatSegment)
        );

        await this.chatSegmentRepository.save(chatSegments);
      }

      console.log(`📝 Processed transcription for meeting: ${meetingId}`);
      console.log(`📊 Word count: ${wordCount}, Confidence: ${Math.round(confidence * 100)}%`);
      return { transcript, chatSegments, duration: metadata.duration };
    } catch (error) {
      console.error('Failed to process transcription results:', error);
      throw error;
    }
  }

  /**
   * Delete transcription and related chat segments
   */
  async deleteTranscription(transcriptionId: string): Promise<boolean> {
    try {
      // Delete related chat segments first
      await this.chatSegmentRepository.delete({ transcriptionId });

      // Delete transcription
      await this.transcriptionRepository.delete({ id: transcriptionId });

      console.log(`🗑️ Deleted transcription: ${transcriptionId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete transcription:', error);
      return false;
    }
  }
}
