import { Repository } from 'typeorm';
import { AppDataSource } from '../config/ormconfig';
import { ActionItem } from '../entities/ActionItem';
import { removeNullValues } from '../utils/common';

interface ActionItemListOptions {
  meetingId?: string;
  limit?: number;
  offset?: number;
  status?: string;
  priority?: string;
  speaker?: string;
}

interface ActionItemUpdateData {
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  speaker?: string;
  dueDate?: Date;
}

export class ActionItemService {
  private actionItemRepository: Repository<ActionItem>;

  constructor() {
    this.actionItemRepository = AppDataSource.getRepository(ActionItem);
  }

  /**
   * Get action items with optional meetingId filter
   */
  async getActionItems(options: ActionItemListOptions = {}): Promise<{
    actionItems: ActionItem[];
    total: number;
  }> {
    const { meetingId, limit = 20, offset = 0, status, priority, speaker } = options;

    const whereCondition: any = removeNullValues({
      meetingId,
      status,
      priority,
      speaker,
    });

    const [actionItems, total] = await this.actionItemRepository.findAndCount({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      actionItems,
      total,
    };
  }

  /**
   * Create a new action item
   */
  async createActionItem(data: {
    meetingId: string;
    description: string;
    priority?: 'high' | 'medium' | 'low';
    speaker?: string;
    dueDate?: Date;
    createdBy: string;
  }): Promise<ActionItem> {
    const actionItem = this.actionItemRepository.create({
      ...data,
      status: 'pending',
      priority: data.priority || 'medium',
    });

    return await this.actionItemRepository.save(actionItem);
  }

  /**
   * Update an action item
   */
  async updateActionItem(actionItemId: string, data: ActionItemUpdateData): Promise<ActionItem | null> {
    const actionItem = await this.actionItemRepository.findOne({
      where: { id: actionItemId },
    });

    if (!actionItem) {
      return null;
    }

    Object.assign(actionItem, data);
    return await this.actionItemRepository.save(actionItem);
  }

  /**
   * Delete an action item
   */
  async deleteActionItem(actionItemId: string): Promise<boolean> {
    try {
      await this.actionItemRepository.delete({ id: actionItemId });
      console.log(`🗑️ Deleted action item: ${actionItemId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete action item:', error);
      return false;
    }
  }
}
