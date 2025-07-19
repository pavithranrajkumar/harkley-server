import { Request, Response } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { Transcription } from '../entities/Transcription';
import { ChatSegment } from '../entities/ChatSegment';
import { ActionItem } from '../entities/ActionItem';
import { Meeting } from '../entities/Meeting';
import { sendSuccess, sendError } from '../utils/response';

export class WebhookController {
  /**
   * Handle Deepgram transcription webhook
   */
  static async handleTranscriptionWebhook(req: Request, res: Response): Promise<void> {
    try {
      console.log('🎤 Received Deepgram webhook:', req.body);

      const { results, metadata } = req.body;

      // Extract meeting ID from metadata
      const meetingId = metadata?.meeting_id;
      if (!meetingId) {
        console.error('❌ No meeting_id in webhook metadata');
        sendError(res, 'INVALID_WEBHOOK', 'Missing meeting_id in metadata', 400);
        return;
      }

      // Process transcription results
      await WebhookController.processTranscriptionResults(meetingId, results);

      // Update meeting status to completed
      await WebhookController.updateMeetingStatus(meetingId, 'completed');

      console.log(`✅ Webhook processed successfully for meeting: ${meetingId}`);
      sendSuccess(res, { status: 'processed' }, 'Webhook processed successfully');
    } catch (error) {
      console.error('❌ Webhook processing failed:', error);
      sendError(res, 'WEBHOOK_ERROR', 'Failed to process webhook', 500);
    }
  }

  /**
   * Process transcription results and save to database
   */
  private static async processTranscriptionResults(meetingId: string, results: any): Promise<void> {
    const channels = results.channels;
    const channel = channels[0];

    // Extract full transcript
    const fullText = channel.alternatives[0].transcript;

    // Extract utterances with speaker diarization
    const utterances = channel.alternatives[0].paragraphs?.sentences || [];

    // Calculate word count
    const wordCount = fullText.split(' ').length;

    // Get confidence score
    const confidence = channel.alternatives[0].confidence;

    // Save transcription to database
    const transcriptionRepository = AppDataSource.getRepository(Transcription);
    const transcriptionRecord = await transcriptionRepository.save({
      meeting_id: meetingId,
      status: 'completed',
      full_text: fullText,
      confidence: Math.round(confidence * 100),
      language: 'en',
      word_count: wordCount,
      summary: results.summary?.short || null,
    });

    // Save chat segments (utterances with speaker info)
    if (utterances.length > 0) {
      const chatSegments = utterances.map((utterance: any) => ({
        transcription_id: transcriptionRecord.id,
        speaker_number: utterance.speaker || 0,
        text: utterance.text,
        start_time: Math.round(utterance.start * 1000), // Convert to milliseconds
        end_time: Math.round(utterance.end * 1000),
        confidence: Math.round(utterance.confidence * 100),
      }));

      const chatSegmentRepository = AppDataSource.getRepository(ChatSegment);
      await chatSegmentRepository.save(chatSegments);
    }

    // Extract and save action items
    await WebhookController.extractActionItems(meetingId, fullText, utterances);

    console.log(`📝 Processed transcription for meeting: ${meetingId}`);
    console.log(`📊 Word count: ${wordCount}, Confidence: ${Math.round(confidence * 100)}%`);
  }

  /**
   * Extract action items from transcript
   */
  private static async extractActionItems(meetingId: string, fullText: string, utterances: any[]): Promise<void> {
    // Simple action item extraction based on keywords
    const actionKeywords = [
      'action item',
      'todo',
      'task',
      'follow up',
      'next steps',
      'assign',
      'deadline',
      'need to',
      'should',
      'must',
      'will do',
      'going to',
      'plan to',
    ];

    const actionItems: any[] = [];

    // Look for action items in utterances
    utterances.forEach((utterance: any) => {
      const text = utterance.text.toLowerCase();
      const hasActionKeyword = actionKeywords.some((keyword) => text.includes(keyword));

      if (hasActionKeyword) {
        actionItems.push({
          meeting_id: meetingId,
          speaker_number: utterance.speaker || 0,
          description: utterance.text,
          priority: WebhookController.determinePriority(utterance.text),
          status: 'pending',
        });
      }
    });

    // Save action items to database
    if (actionItems.length > 0) {
      const actionItemRepository = AppDataSource.getRepository(ActionItem);
      await actionItemRepository.save(actionItems);
      console.log(`📋 Extracted ${actionItems.length} action items`);
    }
  }

  /**
   * Determine priority based on text content
   */
  private static determinePriority(text: string): string {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('critical')) {
      return 'high';
    } else if (lowerText.includes('important') || lowerText.includes('priority')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Update meeting status
   */
  private static async updateMeetingStatus(meetingId: string, status: string): Promise<void> {
    const meetingRepository = AppDataSource.getRepository(Meeting);
    await meetingRepository.update(meetingId, { status });
  }
}
