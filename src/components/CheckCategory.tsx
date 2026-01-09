'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { CategoryResult } from '@/types';
import { IssueCard } from './IssueCard';
import { cn } from '@/lib/utils';

interface CheckCategoryProps {
  category: CategoryResult;
  defaultExpanded?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-[var(--success)]';
  if (score >= 60) return 'text-[var(--warning)]';
  return 'text-[var(--error)]';
}

export function CheckCategory({ category, defaultExpanded = true }: CheckCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const passedCount = category.checks.filter(c => c.status === 'pass').length;
  const totalCount = category.checks.length;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--surface)] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">{category.name}</span>
          <span className="text-xs text-[var(--muted)]">
            {passedCount}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("text-sm font-medium tabular-nums", getScoreColor(category.score))}>
            {category.score}%
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-[var(--muted)] transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t">
          {category.checks.map((check) => (
            <IssueCard key={check.id} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}
