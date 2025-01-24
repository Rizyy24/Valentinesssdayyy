import { encode } from 'gpt-tokenizer';

/**
 * Counts the number of tokens in a given text string
 * @param text The text to count tokens for
 * @returns The number of tokens in the text
 */
export function countTokens(text: string): number {
  if (!text) {
    return 0;
  }

  return encode(text).length;
}

/**
 * Calculates token usage for messages and system prompt
 * @param messages The message text to count tokens for
 * @param systemPrompt Optional system prompt to include in token count
 * @param includeSystemPrompt Whether to include system prompt tokens in the prompt token count
 * @returns Object containing prompt, system prompt, completion and total token counts
 */
export function calculateMessageTokens(
  messages: string,
  systemPrompt: string = '',
  includeSystemPrompt: boolean = false,
): {
  promptTokens: number;
  systemPromptTokens: number;
  completionTokens: number;
  totalTokens: number;
} {
  const messageTokens = countTokens(messages);
  const systemPromptTokens = systemPrompt ? countTokens(systemPrompt) : 0;
  const promptTokens = includeSystemPrompt ? messageTokens + systemPromptTokens : messageTokens;
  const completionTokens = 0; // This will be filled by the API response

  return {
    promptTokens,
    systemPromptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };
}
