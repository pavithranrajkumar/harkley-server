import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/ormconfig';
import { Meeting } from '../entities/Meeting';
import { Transcription } from '../entities/Transcription';
import { ChatSegment } from '../entities/ChatSegment';
import { ActionItem } from '../entities/ActionItem';
import { CreateMeetingData, UpdateMeetingData } from '../types/meeting';
import { DeepgramResponse, SyncPrerecordedResponse } from '@deepgram/sdk';
import { FileUploadService } from './fileUploadService';

interface MeetingListOptions {
  limit?: number;
  offset?: number;
  status?: string;
  includeTranscriptions?: boolean;
  includeActionItems?: boolean;
}

interface MeetingDetailOptions {
  includeTranscriptions?: boolean;
  includeActionItems?: boolean;
  includeChatSegments?: boolean;
  transcriptionLimit?: number;
  chatSegmentLimit?: number;
}

export class MeetingService {
  private meetingRepository: Repository<Meeting>;
  private transcriptionRepository: Repository<Transcription>;
  private chatSegmentRepository: Repository<ChatSegment>;

  constructor() {
    this.meetingRepository = AppDataSource.getRepository(Meeting);
    this.transcriptionRepository = AppDataSource.getRepository(Transcription);
    this.chatSegmentRepository = AppDataSource.getRepository(ChatSegment);
  }

  /**
   * Create a new meeting
   */
  async createMeeting(data: CreateMeetingData): Promise<Meeting> {
    const meeting = this.meetingRepository.create({
      ...data,
      status: 'active',
    });

    const savedMeeting = await this.meetingRepository.save(meeting);
    return savedMeeting;
  }

  /**
   * Get meetings for a user with optimized querying
   */
  async getUserMeetings(
    userId: string,
    options: MeetingListOptions = {}
  ): Promise<{
    meetings: Meeting[];
    total: number;
  }> {
    const { limit = 20, offset = 0, status, includeTranscriptions = false, includeActionItems = false } = options;

    // Build where condition
    const whereCondition: any = { userId };
    if (status) {
      whereCondition.status = status;
    }

    // Build query options with selective loading
    const queryOptions: any = {
      where: whereCondition,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    };

    // Only load relations if requested
    const relations: string[] = [];
    if (includeTranscriptions) relations.push('transcriptions');
    if (includeActionItems) relations.push('actionItems');

    if (relations.length > 0) {
      queryOptions.relations = relations;
    }

    const [meetings, total] = await this.meetingRepository.findAndCount(queryOptions);

    return {
      meetings,
      total,
    };
  }

  /**
   * Get a single meeting by ID with selective loading
   */
  async getMeetingById(meetingId: string, userId: string, options: MeetingDetailOptions = {}): Promise<Meeting | null> {
    const {
      includeTranscriptions = true,
      includeActionItems = true,
      includeChatSegments = false,
      transcriptionLimit = 10,
      chatSegmentLimit = 100,
    } = options;

    // First, get the basic meeting without relations
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId, userId },
      select: ['id', 'title', 'duration', 'file_size', 'file_path', 'summary', 'status', 'userId', 'createdAt', 'updatedAt'],
    });

    if (!meeting) {
      return null;
    }

    // Load relations separately based on options
    if (includeTranscriptions) {
      const transcriptions = await this.transcriptionRepository.find({
        where: { meetingId },
        take: transcriptionLimit,
        order: { createdAt: 'DESC' },
      });

      // Load chat segments if requested
      if (includeChatSegments && transcriptions.length > 0) {
        const transcriptionIds = transcriptions.map((t) => t.id);
        const chatSegments = await this.chatSegmentRepository.find({
          where: { transcriptionId: In(transcriptionIds) },
          take: chatSegmentLimit,
          order: { startTime: 'ASC' },
        });

        // Group chat segments by transcription
        const segmentsByTranscription = chatSegments.reduce((acc, segment) => {
          if (!acc[segment.transcriptionId]) {
            acc[segment.transcriptionId] = [];
          }
          acc[segment.transcriptionId].push(segment);
          return acc;
        }, {} as Record<string, ChatSegment[]>);

        // Attach chat segments to transcriptions
        transcriptions.forEach((transcription) => {
          transcription.chatSegments = segmentsByTranscription[transcription.id] || [];
        });
      }

      meeting.transcriptions = transcriptions;
    }

    if (includeActionItems) {
      const actionItems = await AppDataSource.getRepository(ActionItem).find({
        where: { meetingId },
        order: { createdAt: 'DESC' },
      });
      meeting.actionItems = actionItems;
    }

    // Generate signed URL only if needed
    if (meeting.file_path) {
      meeting.file_path = await new FileUploadService().generateSignedUrl(meeting.file_path);
    }

    return meeting;
  }

  /**
   * Get light meeting list (no relations) - for dashboard/listing
   */
  async getLightMeetingList(
    userId: string,
    options: { limit?: number; offset?: number; status?: string } = {}
  ): Promise<{
    meetings: Partial<Meeting>[];
    total: number;
  }> {
    const { limit = 20, offset = 0, status } = options;

    const whereCondition: any = { userId };
    if (status) {
      whereCondition.status = status;
    }

    const [meetings, total] = await this.meetingRepository.findAndCount({
      where: whereCondition,
      select: ['id', 'title', 'duration', 'file_size', 'status', 'createdAt'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      meetings,
      total,
    };
  }

  /**
   * Get meeting with transcriptions only
   */
  async getMeetingWithTranscriptions(
    meetingId: string,
    userId: string,
    options: { includeChatSegments?: boolean; chatSegmentLimit?: number } = {}
  ): Promise<Meeting | null> {
    const { includeChatSegments = false, chatSegmentLimit = 100 } = options;

    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId, userId },
      relations: ['transcriptions'],
    });

    if (!meeting) {
      return null;
    }

    // Load chat segments if requested
    if (includeChatSegments && meeting.transcriptions.length > 0) {
      const transcriptionIds = meeting.transcriptions.map((t) => t.id);
      const chatSegments = await this.chatSegmentRepository.find({
        where: { transcriptionId: In(transcriptionIds) },
        take: chatSegmentLimit,
        order: { startTime: 'ASC' },
      });

      // Group and attach chat segments
      const segmentsByTranscription = chatSegments.reduce((acc, segment) => {
        if (!acc[segment.transcriptionId]) {
          acc[segment.transcriptionId] = [];
        }
        acc[segment.transcriptionId].push(segment);
        return acc;
      }, {} as Record<string, ChatSegment[]>);

      meeting.transcriptions.forEach((transcription) => {
        transcription.chatSegments = segmentsByTranscription[transcription.id] || [];
      });
    }

    // Generate signed URL
    if (meeting.file_path) {
      meeting.file_path = await new FileUploadService().generateSignedUrl(meeting.file_path);
    }

    return meeting;
  }

  /**
   * Get meeting with action items only
   */
  async getMeetingWithActionItems(meetingId: string, userId: string): Promise<Meeting | null> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId, userId },
      relations: ['actionItems'],
    });

    if (!meeting) {
      return null;
    }

    // Generate signed URL
    if (meeting.file_path) {
      meeting.file_path = await new FileUploadService().generateSignedUrl(meeting.file_path);
    }

    return meeting;
  }

  /**
   * Update a meeting
   */
  async updateMeeting(meetingId: string, userId: string, data: UpdateMeetingData): Promise<Meeting | null> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId, userId },
    });

    if (!meeting) {
      return null;
    }

    Object.assign(meeting, data);
    const updatedMeeting = await this.meetingRepository.save(meeting);
    return updatedMeeting;
  }

  async deleteMeeting(meetingId: string, userId: string): Promise<boolean> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId, userId },
    });

    if (!meeting) {
      return false;
    }

    await this.meetingRepository.softDelete(meetingId);
    return true;
  }

  /**
   * Get meeting statistics for a user - optimized with aggregation
   */
  async getUserMeetingStats(userId: string): Promise<{
    totalMeetings: number;
    totalDuration: number;
    averageDuration: number;
    activeMeetings: number;
  }> {
    // Use aggregation queries for better performance
    const stats = await this.meetingRepository
      .createQueryBuilder('meeting')
      .select([
        'COUNT(*) as totalMeetings',
        'SUM(meeting.duration) as totalDuration',
        'AVG(meeting.duration) as averageDuration',
        'COUNT(CASE WHEN meeting.status = :activeStatus THEN 1 END) as activeMeetings',
      ])
      .where('meeting.userId = :userId', { userId })
      .setParameter('activeStatus', 'active')
      .getRawOne();

    return {
      totalMeetings: parseInt(stats.totalMeetings) || 0,
      totalDuration: parseInt(stats.totalDuration) || 0,
      averageDuration: Math.round(parseFloat(stats.averageDuration) || 0),
      activeMeetings: parseInt(stats.activeMeetings) || 0,
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
  }> {
    try {
      const results = transcriptionResponse.result?.results!;
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
      return { transcript, chatSegments };
    } catch (error) {
      console.error('Failed to process transcription results:', error);
      throw error;
    }
  }
}
