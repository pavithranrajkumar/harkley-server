import { Request, Response } from 'express';
import { getUserId, RequestWithUser } from '../types/express';
import { MeetingService } from '../services/meetingService';
import { FileUploadService } from '../services/fileUploadService';
import { MeetingProcessingService } from '../services/meetingProcessingService';
import { sendSuccess, sendError, sendBadRequest } from '../utils/response';
import { getErrorMessage } from '../utils/error';
import { getPaginationParams } from '../utils/pagination';
import { removeNullValues } from '../utils/common';

export class MeetingController {
  /**
   * Upload recording and create meeting with background processing
   */
  static async createMeeting(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const file = req.file;
      const userId = getUserId(req);

      if (!file) {
        sendBadRequest(res, 'Recording file is required');
        return;
      }

      // Upload file to Supabase storage
      const fileUploadService = new FileUploadService();
      const uploadResult = await fileUploadService.uploadFile(file, userId);

      // Create meeting record with initial status
      const meetingData = {
        title: 'Untitled Meeting',
        file_path: uploadResult.filePath,
        file_size: uploadResult.fileSize,
        userId,
        status: 'queued',
      };

      const meetingService = new MeetingService();
      const meeting = await meetingService.createMeeting(meetingData);

      // Generate signed URL for processing
      const signedUrl = await fileUploadService.generateSignedUrl(uploadResult.filePath);

      // Process meeting in background (non-blocking) - start before sending response
      setImmediate(async () => {
        try {
          const processingService = new MeetingProcessingService();
          await processingService.processMeetingInBackground(meeting.id, signedUrl, userId);
        } catch (error) {
          console.error(`❌ Background processing failed for meeting ${meeting.id}:`, error);
        }
      });

      // Return success response after starting background processing
      sendSuccess(
        res,
        {
          meetingId: meeting.id,
          fileUrl: uploadResult.fileUrl,
          processingStatus: 'queued',
          message: 'Recording uploaded successfully. Processing started in background.',
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
   * Get meeting by ID - clean and simple
   */
  static async getMeeting(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = getUserId(req);

      const meetingService = new MeetingService();
      const meeting = await meetingService.getMeetingById(id, userId);

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
   * Get all meetings for user - clean and simple
   */
  static async getMeetings(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);
      const { status } = req.query;

      const { page, limit, offset } = getPaginationParams(req.query);

      const meetingService = new MeetingService();
      const result = await meetingService.getUserMeetings(userId, {
        limit,
        offset,
        status,
      });

      sendSuccess(
        res,
        {
          meetings: result.meetings,
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
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
  static async updateMeeting(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const { title, summary } = req.body;

      const updateData = removeNullValues({ title, summary });

      const meetingService = new MeetingService();
      const meeting = await meetingService.updateMeeting(id, userId, updateData);

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
  static async deleteMeeting(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = getUserId(req);

      const meetingService = new MeetingService();
      const success = await meetingService.deleteMeeting(id, userId);

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
  static async getMeetingStats(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);

      const meetingService = new MeetingService();
      const stats = await meetingService.getUserMeetingStats(userId);
      console.log({ stats });
      sendSuccess(res, stats, 'Meeting statistics retrieved successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to get meeting statistics');
      sendError(res, 'MEETING_STATS_ERROR', message, 400);
    }
  }
}
