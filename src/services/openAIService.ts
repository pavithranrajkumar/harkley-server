import OpenAI from 'openai';
import { env } from '../config/env';
import { AppDataSource } from '../config/ormconfig';
import { ActionItem } from '../entities/ActionItem';

// Types for better type safety
interface ActionItemData {
  description: string;
  priority: 'high' | 'medium' | 'low';
  speaker?: string;
  assignee?: string;
}

interface ActionItemsResponse {
  actionItems: ActionItemData[];
}

interface OpenAIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

interface PromptTemplate {
  system: string;
  user: string;
}

export class OpenAIService {
  private openai: OpenAI;
  private readonly config: OpenAIConfig;
  private prompts: Record<string, PromptTemplate>;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    this.config = {
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      maxTokens: 1000,
    };

    this.prompts = {
      actionItems: {
        system: 'You are an expert at analyzing meeting transcripts and extracting actionable items. Be concise and practical.',
        user: `Analyze the following meeting transcript and extract action items. 
For each action item, provide:
- A clear, actionable description
- Priority level (high, medium, low) based on urgency and importance
- Speaker identification if mentioned

Transcript:
{transcript}

Return the action items in JSON format:
{
  "actionItems": [
    {
      "description": "Clear action item description",
      "priority": "high|medium|low",
      "speaker": "Speaker name or number if mentioned",
      "assignee": "Person assigned if mentioned"
    }
  ]
}`,
      },
      summary: {
        system: 'You are an expert at summarizing meeting content. Be concise and highlight key points.',
        user: `Create a concise summary of the following meeting transcript. 
Focus on key decisions, main topics discussed, and important outcomes.
Keep it under 200 words.

Transcript:
{transcript}`,
      },
    };
  }

  /**
   * Make a generic OpenAI API call with error handling
   */
  private async makeOpenAICall(promptType: keyof typeof this.prompts, transcript: string, customConfig?: Partial<OpenAIConfig>): Promise<string> {
    try {
      const prompt = this.prompts[promptType];
      const config = { ...this.config, ...customConfig };

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
    } catch (error: any) {
      this.handleOpenAIError(error, promptType);
      throw error;
    }
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
   * Handle OpenAI API errors consistently
   */
  private handleOpenAIError(error: any, operation: string): void {
    if (error.status === 429) {
      console.warn(`⚠️ OpenAI rate limit exceeded. Skipping ${operation}.`);
      console.warn('💡 Consider upgrading your OpenAI plan or adding billing information.');
      return;
    }

    console.error(`Failed to perform ${operation} with OpenAI:`, error);
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
   * Save action items to database
   */
  private async saveActionItems(meetingId: string, actionItems: ActionItemData[]): Promise<void> {
    const actionItemRepository = AppDataSource.getRepository(ActionItem);

    const actionItemsToSave = actionItems.map((item) => ({
      meetingId,
      description: item.description,
      priority: item.priority,
      status: 'pending' as const,
      assignee: item.assignee || undefined,
    }));

    await actionItemRepository.save(actionItemsToSave);
    console.log(`📋 Saved ${actionItemsToSave.length} action items to database`);
  }

  /**
   * Extract action items from meeting transcript
   */
  async extractActionItems(meetingId: string, transcript: string): Promise<void> {
    try {
      console.log(`🤖 Extracting action items for meeting: ${meetingId}`);

      const response = await this.makeOpenAICall('actionItems', transcript);
      const actionItemsData = this.parseJSONResponse<ActionItemsResponse>(response);

      if (actionItemsData.actionItems && actionItemsData.actionItems.length > 0) {
        await this.saveActionItems(meetingId, actionItemsData.actionItems);
        console.log(`✅ Extracted ${actionItemsData.actionItems.length} action items`);
      } else {
        console.log('📋 No action items found in transcript');
      }
    } catch (error: any) {
      // Handle rate limit errors gracefully
      if (error.status === 429) {
        console.warn('⚠️ Skipping action item extraction due to rate limit');
        return;
      }

      console.error('Failed to extract action items:', error);
      console.warn('⚠️ Action item extraction failed, but meeting was created successfully');
    }
  }

  /**
   * Generate meeting summary
   */
  async generateSummary(transcript: string): Promise<string | null> {
    try {
      console.log('🤖 Generating meeting summary...');

      const summary = await this.makeOpenAICall('summary', transcript, {
        maxTokens: 300,
      });

      console.log('✅ Meeting summary generated');
      return summary;
    } catch (error: any) {
      if (error.status === 429) {
        console.warn('⚠️ Skipping summary generation due to rate limit');
        return null;
      }

      console.error('Failed to generate summary:', error);
      return null;
    }
  }

  /**
   * Extract topics from meeting transcript
   */
  async extractTopics(transcript: string): Promise<string[] | null> {
    try {
      console.log('🤖 Extracting meeting topics...');

      const topicsPrompt: PromptTemplate = {
        system: 'You are an expert at identifying key topics from meeting transcripts.',
        user: `Extract the main topics discussed in this meeting transcript. 
Return only the topic names as a JSON array of strings.

Transcript:
{transcript}

Return format:
{
  "topics": ["topic1", "topic2", "topic3"]
}`,
      };

      // Create a temporary prompts object with topics
      const tempPrompts = { ...this.prompts, topics: topicsPrompt };

      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: topicsPrompt.system },
          { role: 'user', content: topicsPrompt.user.replace('{transcript}', transcript) },
        ],
        temperature: this.config.temperature,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI for topics');
      }

      const cleanContent = this.cleanResponseContent(content);
      const topicsData = this.parseJSONResponse<{ topics: string[] }>(cleanContent);
      console.log('✅ Meeting topics extracted');
      return topicsData.topics;
    } catch (error: any) {
      if (error.status === 429) {
        console.warn('⚠️ Skipping topic extraction due to rate limit');
        return null;
      }

      console.error('Failed to extract topics:', error);
      return null;
    }
  }
}
