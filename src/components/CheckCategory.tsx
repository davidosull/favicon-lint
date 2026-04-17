'use client';

import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { CategoryResult } from '@/types';
import { IssueCard } from './IssueCard';
import { cn } from '@/lib/utils';

interface CheckCategoryProps {
  category: CategoryResult;
  defaultExpanded?: boolean;
  isLast?: boolean;
}

function categoryTone(
  category: CategoryResult
): 'ok' | 'warn' | 'err' {
  const hasFail = category.checks.some((c) => c.status === 'fail');
  if (hasFail) return 'err';
  if (category.score < 80) return 'warn';
  return 'ok';
}

const dotStyle: Record<'ok' | 'warn' | 'err', string> = {
  ok: 'bg-[var(--success)] shadow-[0_0_0_3px_var(--success-muted)]',
  warn: 'bg-[var(--warning)] shadow-[0_0_0_3px_var(--warning-muted)]',
  err: 'bg-[var(--error)] shadow-[0_0_0_3px_var(--error-muted)]',
};

const pillStyle: Record<'ok' | 'warn' | 'err', string> = {
  ok: 'bg-[var(--success-muted)] text-[var(--success)] border-[color:rgba(76,183,130,0.22)]',
  warn: 'bg-[var(--warning-muted)] text-[var(--warning)] border-[color:rgba(242,201,76,0.22)]',
  err: 'bg-[var(--error-muted)] text-[var(--error)] border-[color:rgba(235,87,87,0.22)]',
};

export function CheckCategory({
  category,
  defaultExpanded = false,
  isLast = false,
}: CheckCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const scorable = category.checks.filter((c) => c.status !== 'info');
  const passedCount = scorable.filter((c) => c.status === 'pass').length;
  const totalCount = scorable.length;
  const infoCount = category.checks.filter((c) => c.status === 'info').length;
  const tone = categoryTone(category);

  const subtitle = buildSubtitle(category);

  return (
    <div className={cn(!isLast && 'border-b')}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full grid grid-cols-[20px_1fr_auto_auto_auto] gap-3 items-center',
          'px-4 py-3 text-left',
          'transition-colors duration-150',
          'hover:bg-[var(--surface-2)] cursor-pointer'
        )}
      >
        <span
          className={cn(
            'w-2.5 h-2.5 rounded-full justify-self-center',
            dotStyle[tone]
          )}
          aria-label={tone}
        />
        <div className='min-w-0 text-sm'>
          <span className='font-[460] text-white'>{category.name}</span>
          {subtitle && (
            <span className='text-[var(--muted)] font-[440]'>
              {' '}
              — {subtitle}
            </span>
          )}
        </div>
        {infoCount > 0 ? (
          <span className='text-[11px] text-[var(--fg-faint)] tabular-nums whitespace-nowrap'>
            +{infoCount} {infoCount === 1 ? 'note' : 'notes'}
          </span>
        ) : (
          <span />
        )}
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border num',
            pillStyle[tone]
          )}
        >
          {passedCount} / {totalCount}
        </span>
        <ChevronRight
          className={cn(
            'w-3.5 h-3.5 text-[var(--fg-faint)] transition-transform duration-150',
            isExpanded && 'rotate-90'
          )}
        />
      </button>

      {isExpanded && (
        <div className='bg-[var(--bg-elev)] pl-[50px] pr-4 pt-1 pb-4'>
          {category.checks.map((check) => (
            <IssueCard key={check.id} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}

function buildSubtitle(category: CategoryResult): string {
  const names = category.checks.map((c) => c.name).slice(0, 3);
  if (category.checks.length > 3) names.push('…');
  return names.join(', ');
}
