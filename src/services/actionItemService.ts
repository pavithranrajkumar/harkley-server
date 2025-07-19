import { Repository } from 'typeorm';
import { AppDataSource } from '../config/ormconfig';
import { ActionItem } from '../entities/ActionItem';
import { removeNullValues } from '../utils/common';
import { ActionItemListOptions, ActionItemUpdateData } from '../types/actionItem';

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
    const { meetingId, createdBy, limit = 20, offset = 0, status, priority, speaker } = options;

    const whereCondition: any = removeNullValues({
      meetingId,
      createdBy,
      status,
      priority,
      speaker,
    });

    const [actionItems, total] = await this.actionItemRepository.findAndCount({
      where: whereCondition,
      order: {
        status: 'DESC',
        createdAt: 'DESC',
      },
      take: limit,
      skip: offset,
      select: ['id', 'description', 'status', 'priority', 'dueDate', 'createdAt'],
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
  async updateActionItem(id: string, data: ActionItemUpdateData): Promise<ActionItem | null> {
    const actionItem = await this.actionItemRepository.findOne({
      where: { id: id },
      select: ['id'],
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
  async deleteActionItem(id: string): Promise<boolean> {
    try {
      await this.actionItemRepository.delete({ id: id });
      return true;
    } catch (error) {
      return false;
    }
  }
}
