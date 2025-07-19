import { Request, Response } from 'express';
import { MeetingService } from '../services/meetingService';
import { FileUploadService } from '../services/fileUploadService';
import { sendSuccess, sendError, sendBadRequest } from '../utils/response';
import { getErrorMessage } from '../utils/error';

export class MeetingController {
  private static meetingService = new MeetingService();
  private static fileUploadService = new FileUploadService();

  /**
   * Upload recording and create meeting
   */
  static async createMeeting(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      const userId = (req as any).user.id; // From auth middleware

      if (!file) {
        sendBadRequest(res, 'Recording file is required');
        return;
      }

      // Upload file to Supabase storage
      const uploadResult = await this.fileUploadService.uploadFile(file, userId);

      // Generate draft title (will be updated by Deepgram processing)
      const draftTitle = `Meeting ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

      // Create meeting record
      const meetingData = {
        title: draftTitle,
        file_path: uploadResult.filePath,
        file_size: uploadResult.fileSize,
        userId,
      };

      const meeting = await this.meetingService.createMeeting(meetingData);

      sendSuccess(
        res,
        {
          meetingId: meeting.id,
          fileUrl: uploadResult.fileUrl,
          processingStatus: 'pending',
          message: 'Recording uploaded successfully. Processing will begin shortly.',
        },
        'Meeting created successfully',
        201
      );
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create meeting');
      sendError(res, 'MEETING_CREATE_ERROR', message, 400);
    }
  }

  /**
   * Get meeting by ID with processing status
   */
  static async getMeeting(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const meeting = await this.meetingService.getMeetingById(id, userId);

      if (!meeting) {
        sendError(res, 'NOT_FOUND', 'Meeting not found', 404);
        return;
      }

      sendSuccess(res, meeting, 'Meeting retrieved successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to get meeting');
      sendError(res, 'MEETING_GET_ERROR', message, 400);
    }
  }

  /**
   * Get all meetings for user
   */
  static async getMeetings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { page = 1, limit = 10, status } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const result = await this.meetingService.getUserMeetings(userId, {
        limit: limitNum,
        offset,
        status: status as string,
      });

      sendSuccess(
        res,
        {
          meetings: result.meetings,
          total: result.total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(result.total / limitNum),
        },
        'Meetings retrieved successfully'
      );
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to get meetings');
      sendError(res, 'MEETINGS_GET_ERROR', message, 400);
    }
  }

  /**
   * Update meeting
   */
  static async updateMeeting(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { title, summary } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (summary !== undefined) updateData.summary = summary;

      const meeting = await this.meetingService.updateMeeting(id, userId, updateData);

      if (!meeting) {
        sendError(res, 'NOT_FOUND', 'Meeting not found', 404);
        return;
      }

      sendSuccess(res, meeting, 'Meeting updated successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to update meeting');
      sendError(res, 'MEETING_UPDATE_ERROR', message, 400);
    }
  }

  /**
   * Delete meeting (soft delete)
   */
  static async deleteMeeting(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const success = await this.meetingService.deleteMeeting(id, userId);

      if (!success) {
        sendError(res, 'NOT_FOUND', 'Meeting not found', 404);
        return;
      }

      sendSuccess(res, null, 'Meeting deleted successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to delete meeting');
      sendError(res, 'MEETING_DELETE_ERROR', message, 400);
    }
  }

  /**
   * Get meeting statistics
   */
  static async getMeetingStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      const stats = await this.meetingService.getUserMeetingStats(userId);

      sendSuccess(res, stats, 'Meeting statistics retrieved successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to get meeting statistics');
      sendError(res, 'MEETING_STATS_ERROR', message, 400);
    }
  }
}
