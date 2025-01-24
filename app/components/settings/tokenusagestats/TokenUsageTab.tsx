import React from 'react';
import { ModelUsageCard } from '~/components/ui/ModelUsageCard';
import { TotalCostCard } from '~/components/ui/TotalCostCard';
import type { ModelUsage } from '~/types/token-usage';
import { ChartBarIcon, DocumentTextIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface TokenUsageTabProps {
  usage: ModelUsage;
  totalTokens: number;
  showTitle: boolean;
  chatTitle?: string;
}

function TokenUsageTab({ usage, totalTokens, showTitle, chatTitle }: TokenUsageTabProps) {
  // Ensure we have valid stats
  const stats = usage.stats || {
    input: { characterCount: 0, tokenCount: 0, inputCost: 0 },
    output: { characterCount: 0, tokenCount: 0, outputCost: 0 },
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Token Usage Statistics</h2>
            {chatTitle && <p className="text-sm text-bolt-elements-textSecondary">Chat: {chatTitle}</p>}
          </div>
        </div>
      )}

      <TotalCostCard usage={usage} />
      <ModelUsageCard usage={usage} totalTokens={totalTokens} />

      {/* Enhanced Usage Details */}
      <div className="mt-2 space-y-4">
        {/* Character Statistics */}
        <div className="rounded-lg border border-bolt-elements-borderColor p-4">
          <div className="flex items-center gap-2 mb-3">
            <DocumentTextIcon className="h-5 w-5 text-bolt-elements-textSecondary" />
            <h3 className="text-md font-medium">Character Statistics</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-bolt-elements-textSecondary">Input</h4>
              <p className="text-2xl font-semibold">{stats.input.characterCount.toLocaleString()}</p>
              <p className="text-sm text-bolt-elements-textSecondary">characters</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-bolt-elements-textSecondary">Output</h4>
              <p className="text-2xl font-semibold">{stats.output.characterCount.toLocaleString()}</p>
              <p className="text-sm text-bolt-elements-textSecondary">characters</p>
            </div>
          </div>
        </div>

        {/* Token Statistics */}
        <div className="rounded-lg border border-bolt-elements-borderColor p-4">
          <div className="flex items-center gap-2 mb-3">
            <ChartBarIcon className="h-5 w-5 text-bolt-elements-textSecondary" />
            <h3 className="text-md font-medium">Token Statistics</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-bolt-elements-textSecondary">Input</h4>
              <p className="text-2xl font-semibold">{stats.input.tokenCount.toLocaleString()}</p>
              <p className="text-sm text-bolt-elements-textSecondary">tokens</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-bolt-elements-textSecondary">Output</h4>
              <p className="text-2xl font-semibold">{stats.output.tokenCount.toLocaleString()}</p>
              <p className="text-sm text-bolt-elements-textSecondary">tokens</p>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="rounded-lg border border-bolt-elements-borderColor p-4">
          <div className="flex items-center gap-2 mb-3">
            <CurrencyDollarIcon className="h-5 w-5 text-bolt-elements-textSecondary" />
            <h3 className="text-md font-medium">Cost Breakdown</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-bolt-elements-textSecondary">Input Cost</span>
              <span className="font-medium">${(stats.input.inputCost || 0).toFixed(6)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-bolt-elements-textSecondary">Output Cost</span>
              <span className="font-medium">${(stats.output.outputCost || 0).toFixed(6)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-bolt-elements-borderColor">
              <span className="text-sm font-medium">Total Cost</span>
              <span className="font-semibold">
                ${((stats.input.inputCost || 0) + (stats.output.outputCost || 0)).toFixed(6)}
              </span>
            </div>
          </div>
        </div>

        {/* Token/Character Ratio */}
        <div className="rounded-lg border border-bolt-elements-borderColor p-4">
          <h3 className="text-md font-medium mb-3">Token/Character Ratio</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-bolt-elements-textSecondary">Input Ratio</h4>
              <p className="text-lg font-semibold">
                {stats.input.characterCount ? (stats.input.tokenCount / stats.input.characterCount).toFixed(2) : '0.00'}
              </p>
              <p className="text-sm text-bolt-elements-textSecondary">tokens per character</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-bolt-elements-textSecondary">Output Ratio</h4>
              <p className="text-lg font-semibold">
                {stats.output.characterCount
                  ? (stats.output.tokenCount / stats.output.characterCount).toFixed(2)
                  : '0.00'}
              </p>
              <p className="text-sm text-bolt-elements-textSecondary">tokens per character</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TokenUsageTab;
