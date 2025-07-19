import { Repository } from 'typeorm';
import { AppDataSource } from '../config/ormconfig';
import { Meeting } from '../entities/Meeting';
import { CreateMeetingData, UpdateMeetingData } from '../types/meeting';

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
      status: 'active',
    });

    const savedMeeting = await this.meetingRepository.save(meeting);
    return savedMeeting;
  }

  /**
   * Get meetings for a user with optional pagination and filtering
   */
  async getUserMeetings(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }
  ): Promise<{
    meetings: Meeting[];
    total: number;
  }> {
    const whereCondition: any = { userId };
    if (options?.status) {
      whereCondition.status = options.status;
    }

    const queryOptions: any = {
      where: whereCondition,
      order: { createdAt: 'DESC' },
    };

    if (options?.limit) {
      queryOptions.take = options.limit;
    }
    if (options?.offset) {
      queryOptions.skip = options.offset;
    }

    const [meetings, total] = await this.meetingRepository.findAndCount(queryOptions);

    return {
      meetings,
      total,
    };
  }

  /**
   * Get a single meeting by ID
   */
  async getMeetingById(meetingId: string, userId: string): Promise<Meeting | null> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId, userId },
      relations: ['transcriptions', 'actionItems'],
    });
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
   * Get meeting statistics for a user
   */
  async getUserMeetingStats(userId: string): Promise<{
    totalMeetings: number;
    totalDuration: number;
    averageDuration: number;
    activeMeetings: number;
  }> {
    const meetings = await this.meetingRepository.find({
      where: { userId },
      select: ['duration', 'status'],
    });

    const totalMeetings = meetings.length;
    const totalDuration = meetings.reduce((sum, meeting) => sum + (meeting.duration || 0), 0);
    const averageDuration = totalMeetings > 0 ? totalDuration / totalMeetings : 0;
    const activeMeetings = meetings.filter((meeting) => meeting.status === 'active').length;

    return {
      totalMeetings,
      totalDuration,
      averageDuration: Math.round(averageDuration),
      activeMeetings,
    };
  }
}
