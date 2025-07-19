import { createClient, DeepgramClient, DeepgramResponse, SyncPrerecordedResponse } from '@deepgram/sdk';
import { env } from '../config/env';

export class TranscriptionService {
  private deepgram: DeepgramClient;

  constructor() {
    this.deepgram = createClient(env.DEEPGRAM_API_KEY);
  }

  /**
   * Start transcription with webhook callback
   */
  async startTranscription(meetingId: string, fileUrl: string): Promise<DeepgramResponse<SyncPrerecordedResponse>> {
    try {
      console.log(`🎤 Starting transcription for meeting: ${meetingId}`);

      // Configure Deepgram options for transcription and diarization
      const options = {
        model: 'nova-3',
        language: 'en-US',
        smart_format: true,
        punctuate: true,
        diarize: true, // Enable speaker diarization
        utterances: true,
        paragraphs: true,
        summarize: 'v2',
        detect_topics: true,
        sentiment: true,
      };

      return await this.deepgram.listen.prerecorded.transcribeUrl({ url: fileUrl }, options);
    } catch (error) {
      console.error(`❌ Failed to start transcription for meeting ${meetingId}:`, error);
      throw error;
    }
  }
}
