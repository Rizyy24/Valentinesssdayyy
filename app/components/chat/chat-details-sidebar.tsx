import { useStore } from '@nanostores/react';
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { chatStore } from '~/lib/stores/chat';
import { useTokenUsage } from '~/lib/hooks/useTokenUsage';
import { ModelUsageCard } from '~/components/ui/ModelUsageCard';

interface ChatDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatDetailsSidebar({ isOpen, onClose }: ChatDetailsSidebarProps) {
  const chat = useStore(chatStore);
  const { modelUsages, totalUsage } = useTokenUsage();
  const [isStatsMinimized, setIsStatsMinimized] = useState(false);

  const hasMessages = chat.messages && chat.messages.length > 0;
  const hasTokenUsage = modelUsages.size > 0;

  // Ensure we have valid stats
  const stats = totalUsage.stats || {
    input: { characterCount: 0, tokenCount: 0, inputCost: 0 },
    output: { characterCount: 0, tokenCount: 0, outputCost: 0 },
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 w-80 bg-bolt-elements-surfacePrimary border-l border-bolt-elements-borderColor transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="h-14 border-b border-bolt-elements-borderColor flex items-center justify-between px-4">
        <h2 className="text-sm font-medium">Chat Details</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-bolt-elements-background-depth-2 rounded-md"
          aria-label="Close sidebar"
        >
          <XMarkIcon className="h-5 w-5 text-bolt-elements-textSecondary" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Chat Title */}
        <div className="p-4 border-b border-bolt-elements-borderColor">
          <p className="text-bolt-elements-textPrimary">{chat.title}</p>
        </div>

        {/* Token Usage Stats */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-bolt-elements-textSecondary">Token Usage</h3>
            {hasTokenUsage && (
              <button
                onClick={() => setIsStatsMinimized(!isStatsMinimized)}
                className="p-1 hover:bg-bolt-elements-background-depth-2 rounded-md"
                aria-label={isStatsMinimized ? 'Show details' : 'Hide details'}
              >
                {isStatsMinimized ? (
                  <ChevronDownIcon className="h-4 w-4 text-bolt-elements-textSecondary" />
                ) : (
                  <ChevronUpIcon className="h-4 w-4 text-bolt-elements-textSecondary" />
                )}
              </button>
            )}
          </div>

          {!hasMessages ? (
            <p className="text-sm text-bolt-elements-textSecondary">No messages in this chat yet.</p>
          ) : !hasTokenUsage ? (
            <p className="text-sm text-bolt-elements-textSecondary">No token usage data available.</p>
          ) : (
            <div className="space-y-3">
              {/* Summary */}
              <div className="flex flex-col gap-2 text-sm text-bolt-elements-textSecondary">
                <div className="flex items-center gap-2">
                  <span>{modelUsages.size} models used</span>
                  <span>•</span>
                  <span>{totalUsage.totalTokens.toLocaleString()} total tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Input: {stats.input.characterCount.toLocaleString()} chars</span>
                  <span>•</span>
                  <span>{stats.input.tokenCount.toLocaleString()} tokens</span>
                  <span>•</span>
                  <span>${(stats.input.inputCost || 0).toFixed(6)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Output: {stats.output.characterCount.toLocaleString()} chars</span>
                  <span>•</span>
                  <span>{stats.output.tokenCount.toLocaleString()} tokens</span>
                  <span>•</span>
                  <span>${(stats.output.outputCost || 0).toFixed(6)}</span>
                </div>
              </div>

              {/* Model Usage Cards */}
              {!isStatsMinimized && (
                <div className="space-y-3 mt-4">
                  {Array.from(modelUsages.entries()).map(([key, usage]) => (
                    <ModelUsageCard key={key} usage={usage} totalTokens={totalUsage.totalTokens} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
