import { streamText as _streamText, convertToCoreMessages } from 'ai';
import { MAX_TOKENS, type FileMap } from './constants';
import { getSystemPrompt } from '~/lib/common/prompts/prompts';
import {
  DEFAULT_MODEL,
  DEFAULT_PROVIDER,
  MODIFICATIONS_TAG_NAME,
  MODEL_LIST,
  PROVIDER_LIST,
  WORK_DIR,
} from '~/utils/constants';
import type { IProviderSetting } from '~/types/model';
import { PromptLibrary } from '~/lib/common/prompt-library';
import { allowedHTMLElements } from '~/utils/markdown';
import { countTokens } from '~/utils/token-counter';
import { createScopedLogger } from '~/utils/logger';
import { createFilesContext, extractPropertiesFromMessage } from './utils';
import type { ModelInfo } from '~/lib/modules/llm/types';

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
  state: 'result';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
  model?: string;
}

export type Messages = Message[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model'>;

const logger = createScopedLogger('stream-text');

interface TokenStats {
  characterCount: number;
  tokenCount: number;
  inputCost?: number;
  outputCost?: number;
}

interface MessageContent {
  type: string;
  text?: string;
}

interface StreamResponse {
  content?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    stats?: {
      input: TokenStats;
      output: TokenStats;
    };
  };
}

interface ExtendedStreamingOptions extends StreamingOptions {
  callbacks?: {
    onCompletion?: (completion: string) => void;
    onResponse?: (response: StreamResponse) => void;
  };
}

interface TokenStats {
  characterCount: number;
  tokenCount: number;
  inputCost?: number;
  outputCost?: number;
}

interface MessageContent {
  type: string;
  text?: string;
}

interface StreamResponse {
  content?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    stats?: {
      input: TokenStats;
      output: TokenStats;
    };
  };
}

// Define streaming options type
interface ExtendedStreamingOptions extends StreamingOptions {
  callbacks?: {
    onCompletion?: (completion: string) => void;
    onResponse?: (response: StreamResponse) => void;
  };
}

interface TokenStats {
  characterCount: number;
  tokenCount: number;
  inputCost?: number;
  outputCost?: number;
}

interface MessageContent {
  type: string;
  text?: string;
}

interface StreamResponse {
  content?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    stats?: {
      input: TokenStats;
      output: TokenStats;
    };
  };
}

// Define streaming options type
interface ExtendedStreamingOptions extends StreamingOptions {
  callbacks?: {
    onCompletion?: (completion: string) => void;
    onResponse?: (response: StreamResponse) => void;
  };
}

export async function streamText(props: {
  messages: Messages;
  env: Env;
  options?: ExtendedStreamingOptions;
  apiKeys?: Record<string, string>;
  files?: FileMap;
  providerSettings?: Record<string, IProviderSetting>;
  promptId?: string;
  contextOptimization?: boolean;
  contextFiles?: FileMap;
  summary?: string;
}) {
  const { messages, env: serverEnv, options, apiKeys, files, providerSettings, promptId } = props;

  let currentModel = DEFAULT_MODEL;
  let currentProvider = DEFAULT_PROVIDER.name;
  const processedMessages = messages.map((message) => {
    if (message.role === 'user') {
      const { model, provider, content } = extractPropertiesFromMessage(message);
      currentModel = model;
      currentProvider = provider;

      return { ...message, content };
    } else if (message.role === 'assistant') {
      const content = message.content;

      return { ...message, content };
    }

    return message;
  });

  let modelDetails = MODEL_LIST.find((m: ModelInfo) => m.name === currentModel);

  const provider = PROVIDER_LIST.find((p) => p.name === currentProvider) || DEFAULT_PROVIDER;

  if (!modelDetails) {
    logger.warn(`Model ${currentModel} not found in provider ${provider.name}, falling back to default model`);

    const defaultModel = MODEL_LIST[0];

    if (!defaultModel) {
      throw new Error('No models available');
    }

    modelDetails = defaultModel;
  }

  logger.info(`Using model ${modelDetails.name} from provider ${provider.name}`);

  const dynamicMaxTokens = modelDetails.maxTokenAllowed ? modelDetails.maxTokenAllowed : MAX_TOKENS;

  // Get system prompt
  let systemPrompt =
    PromptLibrary.getPropmtFromLibrary(promptId || 'default', {
      cwd: WORK_DIR,
      allowedHtmlElements: allowedHTMLElements,
      modificationTagName: MODIFICATIONS_TAG_NAME,
    }) ?? getSystemPrompt();

  // Only include code context if there are files
  if (files) {
    const codeContext = createFilesContext(files);

    if (codeContext) {
      systemPrompt = `${systemPrompt}\n\n${codeContext}`;
    }
  }

  // Calculate system prompt tokens once
  const systemPromptTokens = countTokens(systemPrompt);

  const streamOptions = {
    ...options,
    callbacks: {
      ...options?.callbacks,
      onCompletion: (completion: string) => {
        options?.callbacks?.onCompletion?.(completion);
      },
      onResponse: (response: StreamResponse) => {
        if (response.usage) {
          const lastMessage = messages[messages.length - 1];
          const messageContent =
            typeof lastMessage.content === 'string'
              ? lastMessage.content
              : Array.isArray(lastMessage.content)
                ? (lastMessage.content as MessageContent[]).find((c: MessageContent) => c.type === 'text')?.text || ''
                : '';

          // Get raw token counts from the response
          const rawPromptTokens = response.usage.promptTokens || 0;
          const rawCompletionTokens = response.usage.completionTokens || 0;

          // Only count tokens from actual chat messages by subtracting system prompt tokens
          const promptTokens = Math.max(0, rawPromptTokens - systemPromptTokens);
          const completionTokens = rawCompletionTokens;
          const totalTokens = promptTokens + completionTokens;

          // Update stats with actual message tokens
          response.usage = {
            promptTokens: Number(promptTokens),
            completionTokens: Number(completionTokens),
            totalTokens: Number(totalTokens),
            stats: {
              input: {
                characterCount: messageContent.length,
                tokenCount: promptTokens,
                inputCost: (promptTokens * 0.14) / 1000000, // $0.14 per 1M tokens
              },
              output: {
                characterCount: (response.content || '').length,
                tokenCount: completionTokens,
                outputCost: (completionTokens * 0.28) / 1000000, // $0.28 per 1M tokens
              },
            },
          };
        }

        options?.callbacks?.onResponse?.(response);
      },
    },
  };

  const result = await _streamText({
    model: provider.getModelInstance({
      model: modelDetails.name,
      serverEnv,
      apiKeys,
      providerSettings,
    }),
    system: systemPrompt,
    maxTokens: dynamicMaxTokens,
    messages: convertToCoreMessages(processedMessages as any),
    ...streamOptions,
  });

  return result;
}
