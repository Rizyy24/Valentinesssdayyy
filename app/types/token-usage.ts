import type { Message } from 'ai';

export interface TokenUsageStatsProps {
  messages: Message[];
}

interface TokenStats {
  characterCount: number;
  tokenCount: number;
  inputCost?: number;
  outputCost?: number;
}

export interface TokenUsage {
  stats: {
    input: TokenStats;
    output: TokenStats;
  };
  completionTokens: number;
  promptTokens: number;
  totalTokens: number;
  model?: string;
  provider?: string;
}

export interface ModelUsage {
  stats: {
    input: TokenStats;
    output: TokenStats;
  };
  model: string;
  provider: string;
  completionTokens: number;
  promptTokens: number;
  totalTokens: number;
  count: number;
}

export interface UsageAnnotation {
  type: 'usage';
  value: TokenUsage;
}

export interface ModelAnnotation {
  type: 'model';
  value: string;
}

export interface PricingInfo {
  prompt?: number;
  completion?: number;
}
