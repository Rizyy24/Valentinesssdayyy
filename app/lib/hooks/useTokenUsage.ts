import { useMemo } from 'react';
import type { Message } from 'ai';
import type { ModelUsage, UsageAnnotation } from '~/types/token-usage';
import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';

interface MessageContent {
  type: string;
  text: string;
}

export function useTokenUsage(messages?: Message[]) {
  const chatState = useStore(chatStore);
  const messageList = messages ?? chatState.messages;

  return useMemo(() => {
    const modelUsages = new Map<string, ModelUsage>();

    if (!messageList?.length) {
      return {
        modelUsages,
        totalUsage: {
          completionTokens: 0,
          promptTokens: 0,
          totalTokens: 0,
          stats: {
            input: {
              characterCount: 0,
              tokenCount: 0,
              inputCost: 0,
            },
            output: {
              characterCount: 0,
              tokenCount: 0,
              outputCost: 0,
            },
          },
        },
        promptPercentage: '0.0',
        completionPercentage: '0.0',
      };
    }

    // Process all messages to gather model usage statistics
    messageList.forEach((message: Message, index: number) => {
      if (message.role === 'user') {
        const content =
          typeof message.content === 'string'
            ? message.content
            : Array.isArray(message.content)
              ? (message.content as MessageContent[]).find((c) => c.type === 'text')?.text
              : String(message.content);

        if (typeof content === 'string') {
          const modelMatch = content.match(/\[Model: (.*?)\]/);
          const providerMatch = content.match(/\[Provider: (.*?)\]/);
          const model = modelMatch?.[1];
          const provider = providerMatch?.[1];

          if (model && provider) {
            const assistantMessage = messageList[index + 1];
            const usageAnnotation = assistantMessage?.annotations?.find((annotation: any) => {
              return annotation?.type === 'usage' && annotation?.value !== undefined;
            }) as UsageAnnotation | undefined;

            const key = `${provider}:${model}`;
            const existing = modelUsages.get(key) || {
              model,
              provider,
              completionTokens: 0,
              promptTokens: 0,
              totalTokens: 0,
              count: 0,
              stats: {
                input: {
                  characterCount: 0,
                  tokenCount: 0,
                  inputCost: 0,
                },
                output: {
                  characterCount: 0,
                  tokenCount: 0,
                  outputCost: 0,
                },
              },
            };

            if (usageAnnotation?.value) {
              const { value } = usageAnnotation;
              const cleanContent = content
                .replace(/\[Model:[^\]]+\]/, '')
                .replace(/\[Provider:[^\]]+\]/, '')
                .trim();

              // Update token counts
              existing.completionTokens = value.completionTokens || 0;
              existing.promptTokens = value.promptTokens || 0;
              existing.totalTokens = existing.promptTokens + existing.completionTokens;

              // Update stats
              existing.stats = {
                input: {
                  characterCount: cleanContent.length,
                  tokenCount: value.promptTokens || 0,
                  inputCost: ((value.promptTokens || 0) * 0.14) / 1000000, // $0.14 per 1M tokens
                },
                output: {
                  characterCount: (assistantMessage?.content || '').length,
                  tokenCount: value.completionTokens || 0,
                  outputCost: ((value.completionTokens || 0) * 0.28) / 1000000, // $0.28 per 1M tokens
                },
              };
            }

            existing.count += 1;
            modelUsages.set(key, existing);
          }
        }
      }
    });

    // Calculate total token usage
    const totalUsage = Array.from(modelUsages.values()).reduce(
      (acc, usage) => ({
        completionTokens: acc.completionTokens + usage.completionTokens,
        promptTokens: acc.promptTokens + usage.promptTokens,
        totalTokens: acc.totalTokens + usage.totalTokens,
        stats: {
          input: {
            characterCount: (acc.stats?.input.characterCount || 0) + (usage.stats?.input.characterCount || 0),
            tokenCount: (acc.stats?.input.tokenCount || 0) + (usage.stats?.input.tokenCount || 0),
            inputCost: (acc.stats?.input.inputCost || 0) + (usage.stats?.input.inputCost || 0),
          },
          output: {
            characterCount: (acc.stats?.output.characterCount || 0) + (usage.stats?.output.characterCount || 0),
            tokenCount: (acc.stats?.output.tokenCount || 0) + (usage.stats?.output.tokenCount || 0),
            outputCost: (acc.stats?.output.outputCost || 0) + (usage.stats?.output.outputCost || 0),
          },
        },
      }),
      {
        completionTokens: 0,
        promptTokens: 0,
        totalTokens: 0,
        stats: {
          input: {
            characterCount: 0,
            tokenCount: 0,
            inputCost: 0,
          },
          output: {
            characterCount: 0,
            tokenCount: 0,
            outputCost: 0,
          },
        },
      },
    );

    const promptPercentage =
      totalUsage.totalTokens === 0 ? '0.0' : ((totalUsage.promptTokens / totalUsage.totalTokens) * 100).toFixed(1);
    const completionPercentage =
      totalUsage.totalTokens === 0 ? '0.0' : ((totalUsage.completionTokens / totalUsage.totalTokens) * 100).toFixed(1);

    return {
      modelUsages,
      totalUsage,
      promptPercentage,
      completionPercentage,
    };
  }, [messageList]);
}
