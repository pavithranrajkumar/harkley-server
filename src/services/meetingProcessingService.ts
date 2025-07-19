import { MeetingService } from './meetingService';
import { TranscriptionService } from './transcriptionService';
import { OpenAIService } from './openAIService';
import { MeetingStatus } from '../types/meeting';

export class MeetingProcessingService {
  private meetingService: MeetingService;
  private transcriptionService: TranscriptionService;
  private openAIService: OpenAIService;

  constructor() {
    this.meetingService = new MeetingService();
    this.transcriptionService = new TranscriptionService();
    this.openAIService = new OpenAIService();
  }

  /**
   * Process meeting in background with proper error handling and status updates
   */
  async processMeetingInBackground(meetingId: string, signedUrl: string, userId: string): Promise<void> {
    try {
      await this.updateProcessingStatus(meetingId, MeetingStatus.TRANSCRIBING);

      const transcript = await this.processTranscription(meetingId, signedUrl);

      // Purposely using subsequent await here as these has to be executed in order - And its a background job
      await this.updateProcessingStatus(meetingId, MeetingStatus.ANALYZING);

      await this.processAIAnalysis(meetingId, transcript, userId);

      await this.updateProcessingStatus(meetingId, MeetingStatus.COMPLETED);
    } catch (error) {
      await this.handleProcessingError(meetingId, error);
    }
  }

  /**
   * Process transcription step
   */
  private async processTranscription(meetingId: string, signedUrl: string): Promise<string> {
    try {
      const transcriptionResponse = await this.transcriptionService.startTranscription(signedUrl);
      const { transcript, duration } = await this.transcriptionService.processTranscriptionResults(meetingId, transcriptionResponse);

      // Update meeting with duration and transcription status
      await this.meetingService.updateMeeting(meetingId, '', {
        duration,
        status: MeetingStatus.COMPLETED,
      });

      return transcript;
    } catch (error: any) {
      throw new Error(`Transcription failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Process AI analysis (action items and summary) in parallel
   */
  private async processAIAnalysis(meetingId: string, transcript: string, userId: string): Promise<void> {
    try {
      // Update status to analyzing
      await this.updateProcessingStatus(meetingId, MeetingStatus.ANALYZING);

      // Process action items and summary in parallel for better performance
      const [actionItemsResult, summaryResult] = await Promise.allSettled([
        this.processActionItems(meetingId, transcript, userId),
        this.processSummary(meetingId, transcript, userId),
      ]);

      // Update final meeting status
      await this.meetingService.updateMeeting(meetingId, userId, { status: MeetingStatus.COMPLETED });
    } catch (error: any) {
      throw new Error(`AI analysis failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Process action items extraction
   */
  private async processActionItems(meetingId: string, transcript: string, userId: string): Promise<void> {
    await this.openAIService.extractActionItems(meetingId, transcript, userId);
  }

  /**
   * Process summary and title generation
   */
  private async processSummary(meetingId: string, transcript: string, userId: string): Promise<void> {
    await this.openAIService.generateSummaryAndTitle(meetingId, transcript, userId);
  }

  /**
   * Update processing status in database
   */
  private async updateProcessingStatus(meetingId: string, status: MeetingStatus): Promise<void> {
    await this.meetingService.updateMeeting(meetingId, '', {
      status,
    });
  }

  /**
   * Handle processing errors
   */
  private async handleProcessingError(meetingId: string, error: any): Promise<void> {
    await this.updateProcessingStatus(meetingId, MeetingStatus.FAILED);

    await this.meetingService.updateMeeting(meetingId, '', {
      status: MeetingStatus.FAILED,
    });
  }
}
