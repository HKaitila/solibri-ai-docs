// app/components/Results/GapAnalysis.tsx
// Displays documentation gaps and allows article creation

'use client';

import { useState } from 'react';
import Card from '@/components/Common/Card';
import Button from '@/components/Common/Button';

interface Gap {
  topic: string;
  mentions: number;
}

interface GapAnalysisProps {
  gaps: Gap[];
  onCreateArticle: (topic: string) => void;
  isGenerating: string | null; // Topic being generated
}

export default function GapAnalysis({
  gaps,
  onCreateArticle,
  isGenerating,
}: GapAnalysisProps) {
  const [expandedGaps, setExpandedGaps] = useState<Set<string>>(new Set());

  const toggleExpanded = (topic: string) => {
    const newExpanded = new Set(expandedGaps);
    if (newExpanded.has(topic)) {
      newExpanded.delete(topic);
    } else {
      newExpanded.add(topic);
    }
    setExpandedGaps(newExpanded);
  };

  const handleCreateArticle = (topic: string) => {
    onCreateArticle(topic);
  };

  // No gaps - all topics covered
  if (!gaps.length) {
    return (
      <Card
        title="✅ Documentation Coverage"
        description="All topics are covered"
      >
        <div className="text-center py-8">
          <p className="text-lg text-green-600 mb-2">🎉</p>
          <p className="text-gray-600">
            Excellent! All topics mentioned in the release notes have corresponding
            help articles. Your documentation is complete for this release.
          </p>
        </div>
      </Card>
    );
  }

  // Display gaps with create buttons
  return (
    <Card
      title="⚠️ Documentation Gaps"
      description={`${gaps.length} topic${gaps.length !== 1 ? 's' : ''} need coverage`}
    >
      <div className="space-y-2">
        {gaps.map((gap) => {
          const isExpanded = expandedGaps.has(gap.topic);
          const isGeneratingThis = isGenerating === gap.topic;

          return (
            <div
              key={gap.topic}
              className="overflow-hidden rounded-lg border border-amber-100 bg-amber-50 transition-all hover:border-amber-200 hover:bg-amber-100/50"
            >
              {/* Main gap item */}
              <div className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-amber-900 truncate">
                      {gap.topic}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-amber-200 px-2 py-1 text-xs font-medium text-amber-900 whitespace-nowrap">
                      {gap.mentions} mention{gap.mentions !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isExpanded && (
                    <p className="mt-2 text-xs text-amber-700">
                      This topic appeared {gap.mentions} time{gap.mentions !== 1 ? 's' : ''} in
                      the release notes but has no existing help article.
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="ml-4 flex items-center gap-2">
                  <button
                    onClick={() => toggleExpanded(gap.topic)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-amber-600 hover:bg-amber-200 transition-colors"
                    title={isExpanded ? 'Hide details' : 'Show details'}
                  >
                    {isExpanded ? '−' : '+'}
                  </button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleCreateArticle(gap.topic)}
                    isLoading={isGeneratingThis}
                    disabled={isGenerating !== null && !isGeneratingThis}
                    className="whitespace-nowrap"
                  >
                    {isGeneratingThis ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hint */}
      <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
        <p className="text-xs text-blue-900">
          <span className="font-semibold">💡 Tip:</span> Click "Create" to generate an AI-assisted
          article draft for any gap. The article will be generated in Markdown format and ready to
          review.
        </p>
      </div>
    </Card>
  );
}