import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/ormconfig';
import { Meeting } from '../entities/Meeting';
import { Transcription } from '../entities/Transcription';
import { ChatSegment } from '../entities/ChatSegment';
import { CreateMeetingData, UpdateMeetingData } from '../types/meeting';
import { FileUploadService } from './fileUploadService';

interface MeetingListOptions {
  limit?: number;
  offset?: number;
  status?: string;
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
    const { limit = 20, offset = 0, status } = options;

    // Build where condition
    const whereCondition: any = { userId };
    if (status) {
      whereCondition.status = status;
    }

    // Simple query without relations - clean separation
    const queryOptions: any = {
      where: whereCondition,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    };

    const [meetings, total] = await this.meetingRepository.findAndCount(queryOptions);

    return {
      meetings,
      total,
    };
  }

  /**
   * Get a single meeting by ID - clean and simple
   */
  async getMeetingById(meetingId: string, userId: string): Promise<Meeting | null> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId, userId },
    });

    if (!meeting) {
      return null;
    }

    // Generate signed URL for file access
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
      .select(['COUNT(*) as totalMeetings', 'SUM(meeting.duration) as totalDuration', 'AVG(meeting.duration) as averageDuration'])
      .where('meeting.userId = :userId', { userId })
      .getRawOne();

    return {
      totalMeetings: parseInt(stats.totalmeetings) || 0,
      totalDuration: parseInt(stats.totalduration) || 0,
      averageDuration: Math.round(parseFloat(stats.averageduration) || 0),
      activeMeetings: parseInt(stats.activeMeetings) || 0,
    };
  }
}
