export interface OpenAIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface PromptTemplate {
  system: string;
  user: string;
}

export interface SummaryResponse {
  title: string | null;
  summary: string | null;
}
