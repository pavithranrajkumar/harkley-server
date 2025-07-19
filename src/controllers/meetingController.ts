import { Request, Response } from 'express';
import { getUserId, RequestWithUser } from '../types/express';
import { MeetingService } from '../services/meetingService';
import { FileUploadService } from '../services/fileUploadService';
import { TranscriptionService } from '../services/transcriptionService';
import { sendSuccess, sendError, sendBadRequest } from '../utils/response';
import { getErrorMessage } from '../utils/error';
import { getPaginationParams } from '../utils/pagination';
import { removeNullValues } from '../utils/common';
import { OpenAIService } from '../services/openAIService';

export class MeetingController {
  /**
   * Upload recording and create meeting
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

      // Generate simple generic title
      const draftTitle = 'Untitled Meeting';

      // Create meeting record
      const meetingData = {
        title: draftTitle,
        file_path: uploadResult.filePath,
        file_size: uploadResult.fileSize,
        userId,
      };

      const signedUrl = await fileUploadService.generateSignedUrl(uploadResult.filePath);
      console.log({ signedUrl });
      const meetingService = new MeetingService();
      const meeting = await meetingService.createMeeting(meetingData);

      // Add transcription job to background queue
      const transcriptionService = new TranscriptionService();
      const transcriptionResponse = await transcriptionService.startTranscription(
        meeting.id,
        'https://qycrbgczamjkcrmlneqh.supabase.co/storage/v1/object/sign/meeting-recordings/users/55eb6849-3f56-40f6-8345-799f4c375eaf/meetings/Harkley%20Sample.webm?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWM1YzhmZi1kN2IxLTQ1ZTQtYjlmOC0zZjUwYWQ3YTNhMzUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtZWV0aW5nLXJlY29yZGluZ3MvdXNlcnMvNTVlYjY4NDktM2Y1Ni00MGY2LTgzNDUtNzk5ZjRjMzc1ZWFmL21lZXRpbmdzL0hhcmtsZXkgU2FtcGxlLndlYm0iLCJpYXQiOjE3NTI5NDkyOTIsImV4cCI6MTc1MzU1NDA5Mn0.uHK-VC6oxCc9S-2WNV7C1Ykzl_CPE8xYgzDUk2MI1cI'
      );
      const { transcript } = await meetingService.processTranscriptionResults(meeting.id, transcriptionResponse);

      // Extract action items using ChatGPT
      const openAIService = new OpenAIService();
      await openAIService.extractActionItems(meeting.id, transcript);
      sendSuccess(
        res,
        {
          meetingId: meeting.id,
          fileUrl: uploadResult.fileUrl,
          processingStatus: 'processing',
          message: 'Recording uploaded successfully. Transcription is starting in the background.',
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
   * Get meeting by ID with selective loading options
   */
  static async getMeeting(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const {
        includeTranscriptions = 'true',
        includeActionItems = 'true',
        includeChatSegments = 'false',
        transcriptionLimit = '10',
        chatSegmentLimit = '100',
      } = req.query;

      const meetingService = new MeetingService();
      const meeting = await meetingService.getMeetingById(id, userId, {
        includeTranscriptions: includeTranscriptions === 'true',
        includeActionItems: includeActionItems === 'true',
        includeChatSegments: includeChatSegments === 'true',
        transcriptionLimit: parseInt(transcriptionLimit as string),
        chatSegmentLimit: parseInt(chatSegmentLimit as string),
      });

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
   * Get all meetings for user with selective loading
   */
  static async getMeetings(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);
      const { status, includeTranscriptions = 'false', includeActionItems = 'false' } = req.query;

      const { page, limit, offset } = getPaginationParams(req.query);

      const meetingService = new MeetingService();
      const result = await meetingService.getUserMeetings(userId, {
        limit,
        offset,
        status: status as string,
        includeTranscriptions: includeTranscriptions === 'true',
        includeActionItems: includeActionItems === 'true',
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
   * Get light meeting list (dashboard view) - optimized for performance
   */
  static async getLightMeetings(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);
      const { status } = req.query;
      const { page, limit, offset } = getPaginationParams(req.query);

      const meetingService = new MeetingService();
      const result = await meetingService.getLightMeetingList(userId, {
        limit,
        offset,
        status: status as string,
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
        'Light meetings retrieved successfully'
      );
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to get light meetings');
      sendError(res, 'LIGHT_MEETINGS_GET_ERROR', message, 400);
    }
  }

  /**
   * Get meeting with transcriptions only
   */
  static async getMeetingTranscriptions(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const { includeChatSegments = 'false', chatSegmentLimit = '100' } = req.query;

      const meetingService = new MeetingService();
      const meeting = await meetingService.getMeetingWithTranscriptions(id, userId, {
        includeChatSegments: includeChatSegments === 'true',
        chatSegmentLimit: parseInt(chatSegmentLimit as string),
      });

      if (!meeting) {
        sendError(res, 'NOT_FOUND', 'Meeting not found', 404);
        return;
      }

      sendSuccess(res, meeting, 'Meeting transcriptions retrieved successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to get meeting transcriptions');
      sendError(res, 'MEETING_TRANSCRIPTIONS_ERROR', message, 400);
    }
  }

  /**
   * Get meeting with action items only
   */
  static async getMeetingActionItems(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = getUserId(req);

      const meetingService = new MeetingService();
      const meeting = await meetingService.getMeetingWithActionItems(id, userId);

      if (!meeting) {
        sendError(res, 'NOT_FOUND', 'Meeting not found', 404);
        return;
      }

      sendSuccess(res, meeting, 'Meeting action items retrieved successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to get meeting action items');
      sendError(res, 'MEETING_ACTION_ITEMS_ERROR', message, 400);
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

      sendSuccess(res, stats, 'Meeting statistics retrieved successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to get meeting statistics');
      sendError(res, 'MEETING_STATS_ERROR', message, 400);
    }
  }
}
