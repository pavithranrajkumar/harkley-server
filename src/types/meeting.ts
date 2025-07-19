// Meeting service types
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
  status?: string;
}

// Meeting processing status types
export type ProcessingStatus = 'pending' | 'uploading' | 'processing' | 'transcribing' | 'analyzing' | 'completed' | 'failed';

export interface MeetingWithStatus {
  id: string;
  title: string;
  duration?: number;
  file_size?: number;
  file_path: string;
  summary?: string;
  status: string;
  processing_status: ProcessingStatus;
  processing_error?: string;
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
