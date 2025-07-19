import { Repository, In, FindManyOptions } from 'typeorm';
import { AppDataSource } from '../config/ormconfig';
import { Meeting } from '../entities/Meeting';
import { CreateMeetingData, MeetingListOptions, MeetingStatus, UpdateMeetingData } from '../types/meeting';
import { FileUploadService } from './fileUploadService';
import { removeNullValues } from '../utils/common';

export class MeetingService {
  private meetingRepository: Repository<Meeting>;

  constructor() {
    this.meetingRepository = AppDataSource.getRepository(Meeting);
  }

  /**
   * Create a new meeting
   */
  async createMeeting(data: CreateMeetingData): Promise<Meeting> {
    const meeting = this.meetingRepository.create({
      ...data,
      status: MeetingStatus.QUEUED,
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
    const whereCondition = removeNullValues({ userId, status });

    // Optimized query with select only needed fields
    const queryOptions = {
      where: whereCondition,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      select: ['id', 'title', 'duration', 'file_size', 'summary', 'status', 'userId', 'createdAt', 'updatedAt'],
    };

    const [meetings, total] = await this.meetingRepository.findAndCount(queryOptions as FindManyOptions<Meeting>);

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
      select: ['id'],
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
      select: ['id'],
    });

    if (!meeting) {
      return false;
    }

    await this.meetingRepository.delete(meetingId);
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
