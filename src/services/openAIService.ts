import OpenAI from 'openai';
import { env } from '../config/env';
import { AppDataSource } from '../config/ormconfig';
import { ActionItem } from '../entities/ActionItem';
import { ActionItemsResponse, ActionItemUpdateData } from '../types/actionItem';
import { OpenAIConfig, PromptTemplate, SummaryResponse } from '../types/openai';
import { MeetingService } from './meetingService';

const OPENAI_CONFIG = {
  model: 'gpt-3.5-turbo',
  temperature: 0.3,
  maxTokens: 1000,
  summaryMaxTokens: 400,
};

const TRANSCRIPT_THRESHOLDS = {
  minWords: 50,
};

const PROMPTS = {
  actionItems: {
    system:
      'You are an expert at analyzing meeting transcripts and extracting ONLY the most important, specific, and actionable items. Be extremely selective and avoid generic or repetitive items.',
    user: `Analyze the following meeting transcript and extract ONLY the most critical action items.

STRICT FILTERING RULES:
1. If transcript is empty/null/less than 50 words → return: {"actionItems": []}
2. If transcript contains only noise/errors/filler → return: {"actionItems": []}
3. ONLY extract items that are:
   - SPECIFIC and actionable (not general discussions)
   - Have clear deadlines or timeframes
   - Assigned to specific people
   - Critical to project success
4. AVOID:
   - Generic follow-ups without specifics
   - Repetitive items with same context
   - General discussion points
   - Items without clear ownership
   - Low-priority administrative tasks
5. Prioritize items with deadlines and specific assignees

Transcript:
{transcript}

Return ONLY valid JSON with high-quality action items:
{
  "actionItems": [
    {
      "description": "Specific, actionable task with clear outcome",
      "priority": "high|medium|low",
      "speaker": "Speaker name if mentioned",
      "assignee": "Specific person assigned"
    }
  ]
}`,
  },
  summary: {
    system:
      'You are an expert at analyzing meeting transcripts. Only provide summaries and titles when there is substantial, meaningful content. If the transcript is empty, too short, or contains only noise/errors, return null values.',
    user: `Analyze the following meeting transcript carefully.

IMPORTANT RULES:
1. If the transcript is empty, null, or contains only noise/errors, return: {"title": null, "summary": null}
2. If the transcript is less than 50 words, return: {"title": null, "summary": null}
3. If the transcript contains only filler words, silence indicators, or technical errors, return: {"title": null, "summary": null}
4. Only generate content if there is substantial, meaningful meeting content

Transcript:
{transcript}

Return ONLY valid JSON:
{
  "title": "Descriptive meeting title (max 10 words)" OR null,
  "summary": "Concise summary of key points (max 200 words)" OR null
}`,
  },
};

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  /**
   * Make OpenAI API call with error handling
   */
  private async makeOpenAICall(promptType: keyof typeof PROMPTS, transcript: string, customConfig?: Partial<OpenAIConfig>): Promise<string> {
    const prompt = PROMPTS[promptType];
    const config = { ...OPENAI_CONFIG, ...customConfig };

    const response = await this.openai.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user.replace('{transcript}', transcript) },
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error(`No response from OpenAI for ${promptType}`);
    }

    return this.cleanResponseContent(content);
  }

  /**
   * Clean response content by removing markdown code blocks
   */
  private cleanResponseContent(content: string): string {
    let cleanContent = content.trim();

    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\s*/, '').replace(/\s*```$/, '');
    }

    return cleanContent;
  }

  /**
   * Parse JSON response with error handling
   */
  private parseJSONResponse<T>(content: string): T {
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error(`Invalid JSON response: ${error}`);
    }
  }

  /**
   * Validate transcript before processing
   */
  private isValidTranscript(transcript: string): boolean {
    return Boolean(transcript && transcript.trim().length >= TRANSCRIPT_THRESHOLDS.minWords);
  }

  /**
   * Save action items to database
   */
  private async saveActionItems(meetingId: string, actionItems: ActionItemUpdateData[], userId: string): Promise<void> {
    if (actionItems.length === 0) {
      return;
    }

    const actionItemRepository = AppDataSource.getRepository(ActionItem);

    const actionItemsToSave = actionItems.map((item) => ({
      meetingId,
      description: item.description,
      priority: item.priority,
      status: 'pending' as const,
      speaker: item.speaker,
      createdBy: userId,
    }));

    await actionItemRepository.save(actionItemsToSave);
    console.log(`📋 Saved ${actionItemsToSave.length} action items for meeting ${meetingId}`);
  }

  async extractActionItems(meetingId: string, transcript: string, userId: string): Promise<void> {
    try {
      if (!this.isValidTranscript(transcript)) {
        console.log(`⚠️ Skipping action item extraction for meeting ${meetingId} - transcript too short`);
        return;
      }

      const response = await this.makeOpenAICall('actionItems', transcript);
      const actionItemsData = this.parseJSONResponse<ActionItemsResponse>(response);

      await this.saveActionItems(meetingId, actionItemsData.actionItems, userId);
    } catch {
      return;
    }
  }

  async generateSummaryAndTitle(meetingId: string, transcript: string, userId: string): Promise<{ title: string; summary: string } | null> {
    try {
      if (!this.isValidTranscript(transcript)) {
        console.log(`Skipping summary generation for meeting ${meetingId} - transcript too short`);
        return null;
      }

      const response = await this.makeOpenAICall('summary', transcript, {
        maxTokens: OPENAI_CONFIG.summaryMaxTokens,
      });

      const { title, summary } = this.parseJSONResponse<SummaryResponse>(response);

      if (title && summary) {
        const meetingService = new MeetingService();
        await meetingService.updateMeeting(meetingId, userId, {
          title,
          summary,
        });

        return { title, summary };
      }

      return null;
    } catch (error: any) {
      console.error(`❌ Summary generation failed for meeting ${meetingId}:`, error.message);
      return null;
    }
  }
}
