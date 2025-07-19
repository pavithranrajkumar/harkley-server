import { Response } from 'express';
import { getUserId, RequestWithUser } from '../types/express';
import { ActionItemService } from '../services/actionItemService';
import { sendSuccess, sendError, sendBadRequest } from '../utils/response';
import { getErrorMessage } from '../utils/error';
import { getPaginationParams } from '../utils/pagination';
import { removeNullValues } from '../utils/common';
import { MeetingService } from '../services/meetingService';

export class ActionItemController {
  /**
   * Get action items with optional meetingId filter
   */
  static async getActionItems(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { meetingId, status, priority, speaker } = req.query;
      const { page, limit, offset } = getPaginationParams(req.query);

      const actionItemService = new ActionItemService();
      const result = await actionItemService.getActionItems({
        meetingId: meetingId as string,
        limit,
        offset,
        status: status as string,
        priority: priority as string,
        speaker: speaker as string,
      });

      sendSuccess(
        res,
        {
          actionItems: result.actionItems,
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
        'Action items retrieved successfully'
      );
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to get action items');
      sendError(res, 'ACTION_ITEMS_GET_ERROR', message, 400);
    }
  }

  /**
   * Create a new action item
   */
  static async createActionItem(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);
      const { meetingId, description, priority, speaker, dueDate } = req.body;

      if (!meetingId || !description) {
        sendBadRequest(res, 'Meeting ID and description are required');
        return;
      }

      // Verify meeting exists and user has access
      const meetingService = new MeetingService();
      const meeting = await meetingService.getMeetingById(meetingId, userId);
      if (!meeting) {
        sendError(res, 'NOT_FOUND', 'Meeting not found', 404);
        return;
      }

      const actionItemService = new ActionItemService();
      const actionItem = await actionItemService.createActionItem({
        meetingId,
        description,
        priority,
        speaker,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdBy: userId,
      });

      sendSuccess(res, actionItem, 'Action item created successfully', 201);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create action item');
      sendError(res, 'ACTION_ITEM_CREATE_ERROR', message, 400);
    }
  }

  /**
   * Update an action item
   */
  static async updateActionItem(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { actionItemId } = req.params;
      const { description, priority, status, speaker, dueDate } = req.body;

      const updateData = removeNullValues({
        description,
        priority,
        status,
        speaker,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });

      const actionItemService = new ActionItemService();
      const actionItem = await actionItemService.updateActionItem(actionItemId, updateData);

      if (!actionItem) {
        sendError(res, 'NOT_FOUND', 'Action item not found', 404);
        return;
      }

      sendSuccess(res, actionItem, 'Action item updated successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to update action item');
      sendError(res, 'ACTION_ITEM_UPDATE_ERROR', message, 400);
    }
  }

  /**
   * Delete an action item
   */
  static async deleteActionItem(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { actionItemId } = req.params;

      const actionItemService = new ActionItemService();
      const success = await actionItemService.deleteActionItem(actionItemId);

      if (!success) {
        sendError(res, 'NOT_FOUND', 'Action item not found', 404);
        return;
      }

      sendSuccess(res, null, 'Action item deleted successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to delete action item');
      sendError(res, 'ACTION_ITEM_DELETE_ERROR', message, 400);
    }
  }
}
