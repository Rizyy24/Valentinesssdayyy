import { memo } from 'react';
import { Markdown } from './Markdown';
import type { JSONValue } from 'ai';

interface AssistantMessageProps {
  content: string;
  annotations?: JSONValue[];
}

export const AssistantMessage = memo(({ content, annotations }: AssistantMessageProps) => {
  const filteredAnnotations = (annotations?.filter(
    (annotation: JSONValue) => annotation && typeof annotation === 'object' && Object.keys(annotation).includes('type'),
  ) || []) as { type: string; value: any }[];

  const usage: {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
    isCacheHit?: boolean;
    isCacheMiss?: boolean;
  } = filteredAnnotations.find((annotation) => annotation.type === 'usage')?.value ?? undefined;

  const cacheHitMsg = usage?.isCacheHit ? ' [Cache Hit]' : '';
  const cacheMissMsg = usage?.isCacheMiss ? ' [Cache Miss]' : '';

  return (
    <div className="overflow-hidden w-full">
      {usage && (
        <div className="text-sm text-bolt-elements-textSecondary mb-2">
          Tokens: {usage.totalTokens} (prompt: {usage.promptTokens}, completion: {usage.completionTokens})
          <span className="text-sm text-green-500 ml-1">{cacheHitMsg}</span>
          <span className="text-sm text-red-500 ml-1">{cacheMissMsg}</span>
        </div>
      )}
      <Markdown html>{content}</Markdown>
    </div>
  );
});
