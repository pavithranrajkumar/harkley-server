export interface ChatSegment {
  transcriptionId: string;
  speakerNumber: number;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}
