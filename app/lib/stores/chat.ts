import { map } from 'nanostores';
import type { Message } from 'ai';
import type { TokenUsage } from '~/types/token-usage';

interface ChatStore {
  started: boolean;
  aborted: boolean;
  showChat: boolean;
  messages: Message[];
  title: string;
  tokens: TokenUsage;
}

export const chatStore = map<ChatStore>({
  started: false,
  aborted: false,
  showChat: true,
  messages: [] as Message[],
  title: '',
  tokens: {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    stats: {
      input: { characterCount: 0, tokenCount: 0, inputCost: 0 },
      output: { characterCount: 0, tokenCount: 0, outputCost: 0 },
    },
  },
});

export function updateChatMessages(messages: Message[]) {
  chatStore.setKey('messages', messages);
}
