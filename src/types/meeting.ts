// Meeting service types

export interface MeetingListOptions {
  limit?: number;
  offset?: number;
  status?: string;
}
export interface CreateMeetingData {
  title: string;
  duration?: number;
  file_size?: number;
  file_path: string;
  summary?: string;
  userId: string;
}

export interface UpdateMeetingData {
  title?: string;
  duration?: number;
  file_size?: number;
  file_path?: string;
  summary?: string;
  status?: MeetingStatus;
}

export enum MeetingStatus {
  QUEUED = 'queued',
  TRANSCRIBING = 'transcribing',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Meeting processing status types
export interface MeetingWithStatus {
  id: string;
  title: string;
  duration?: number;
  file_size?: number;
  file_path: string;
  summary?: string;
  status: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Meeting statistics types
export interface MeetingStats {
  totalMeetings: number;
  totalDuration: number;
  averageDuration: number;
  activeMeetings: number;
}
