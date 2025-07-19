import { Response } from 'express';
import { getUserId, RequestWithUser } from '../types/express';
import { TranscriptionService } from '../services/transcriptionService';
import { sendSuccess, sendError, sendBadRequest } from '../utils/response';
import { getErrorMessage } from '../utils/error';
import { getPaginationParams } from '../utils/pagination';

export class TranscriptionController {
  /**
   * Get transcription for a meeting with chat segments included
   */
  static async getTranscriptionByMeeting(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const transcriptionService = new TranscriptionService();
      const transcription = await transcriptionService.getTranscriptionByMeeting(id);

      if (!transcription) {
        sendError(res, 'NOT_FOUND', 'Transcription not found for this meeting', 404);
        return;
      }

      sendSuccess(res, transcription, 'Transcription retrieved successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to get transcription');
      sendError(res, 'TRANSCRIPTION_GET_ERROR', message, 400);
    }
  }

  /**
   * Get a single transcription by ID with chat segments included
   */
  static async getTranscriptionById(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const transcriptionService = new TranscriptionService();
      const transcription = await transcriptionService.getTranscriptionById(id);

      if (!transcription) {
        sendError(res, 'NOT_FOUND', 'Transcription not found', 404);
        return;
      }

      sendSuccess(res, transcription, 'Transcription retrieved successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to get transcription');
      sendError(res, 'TRANSCRIPTION_GET_ERROR', message, 400);
    }
  }

  /**
   * Get transcription statistics for a meeting
   */
  static async getTranscriptionStats(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const transcriptionService = new TranscriptionService();
      const stats = await transcriptionService.getTranscriptionStats(id);

      sendSuccess(res, stats, 'Transcription statistics retrieved successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to get transcription statistics');
      sendError(res, 'TRANSCRIPTION_STATS_ERROR', message, 400);
    }
  }

  /**
   * Get chat segments for a transcription
   */
  static async getChatSegmentsByTranscription(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page, limit, offset } = getPaginationParams(req.query);

      const transcriptionService = new TranscriptionService();
      const result = await transcriptionService.getChatSegmentsByTranscription(id, {
        limit,
        offset,
      });

      sendSuccess(
        res,
        {
          chatSegments: result.chatSegments,
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
        'Chat segments retrieved successfully'
      );
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to get chat segments');
      sendError(res, 'CHAT_SEGMENTS_GET_ERROR', message, 400);
    }
  }

  /**
   * Delete a transcription
   */
  static async deleteTranscription(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const transcriptionService = new TranscriptionService();
      const success = await transcriptionService.deleteTranscription(id);

      if (!success) {
        sendError(res, 'NOT_FOUND', 'Transcription not found', 404);
        return;
      }

      sendSuccess(res, null, 'Transcription deleted successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to delete transcription');
      sendError(res, 'TRANSCRIPTION_DELETE_ERROR', message, 400);
    }
  }
}
