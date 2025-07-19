export interface ActionItemListOptions {
  createdBy?: string;
  limit?: number;
  offset?: number;
  status?: string;
  priority?: string;
  speaker?: string;
  meetingId?: string;
}

export interface ActionItemUpdateData {
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  speaker?: string;
  dueDate?: Date;
}

export interface ActionItemData {
  description: string;
  priority: 'high' | 'medium' | 'low';
  speaker?: string;
  assignee?: string;
}

export interface ActionItemsResponse {
  actionItems: ActionItemData[];
}
