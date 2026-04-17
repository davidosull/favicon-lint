'use client';

import { ExternalLink } from 'lucide-react';
import type { ScanResult } from '@/types';
import { cn } from '@/lib/utils';

interface ResultsSummaryProps {
  result: ScanResult;
}

function scoreTone(score: number): 'ok' | 'warn' | 'err' {
  if (score >= 80) return 'ok';
  if (score >= 60) return 'warn';
  return 'err';
}

function buildScoreSegments(score: number): ('ok' | 'warn' | 'err' | 'off')[] {
  const filled = Math.round((score / 100) * 10);
  const tone = scoreTone(score);
  return Array.from({ length: 10 }, (_, i) =>
    i < filled ? tone : 'off'
  );
}

const segmentClass: Record<'ok' | 'warn' | 'err' | 'off', string> = {
  ok: 'bg-[var(--success)]',
  warn: 'bg-[var(--warning)]',
  err: 'bg-[var(--error)]',
  off: 'bg-white/5',
};

export function ResultsSummary({ result }: ResultsSummaryProps) {
  const allChecks = [
    ...result.categories.basic.checks,
    ...result.categories.sizes.checks,
    ...result.categories.platforms.checks,
    ...result.categories.accessibility.checks,
  ];

  const counts = {
    pass: allChecks.filter((c) => c.status === 'pass').length,
    warning: allChecks.filter((c) => c.status === 'warning').length,
    fail: allChecks.filter((c) => c.status === 'fail').length,
    total: allChecks.length,
  };

  const failedCategories = (
    [
      ['Basic', result.categories.basic],
      ['Sizes', result.categories.sizes],
      ['Platforms', result.categories.platforms],
      ['A11y', result.categories.accessibility],
    ] as const
  )
    .filter(([, cat]) => cat.score < 80)
    .map(([label]) => label)
    .slice(0, 3)
    .join(', ');

  const segments = buildScoreSegments(result.overallScore);
  const criticalPassing = counts.fail === 0;

  return (
    <>
      <div
        className='grid grid-cols-2 md:grid-cols-4 border border-[var(--border-hover)] rounded-xl overflow-hidden'
        style={{
          background:
            'linear-gradient(180deg, var(--surface) 0%, var(--bg-elev) 100%)',
        }}
      >
        <Cell
          label='Overall'
          value={result.overallScore}
          unit='/ 100'
          noBorder
        >
          <div className='mt-3.5 flex gap-[3px]'>
            {segments.map((tone, i) => (
              <span
                key={i}
                className={cn(
                  'flex-1 h-1.5 rounded-[2px]',
                  segmentClass[tone]
                )}
              />
            ))}
          </div>
        </Cell>

        <Cell label='Passed' value={counts.pass} unit={`/ ${counts.total}`}>
          {criticalPassing ? (
            <Pill tone='ok'>All critical passing</Pill>
          ) : (
            <span className='text-xs text-[var(--muted)]'>
              {counts.fail} failing
            </span>
          )}
        </Cell>

        <Cell label='Warnings' value={counts.warning}>
          <span className='text-xs text-[var(--muted)]'>
            {failedCategories || 'None'}
          </span>
        </Cell>

        <Cell label='Errors' value={counts.fail}>
          {counts.fail > 0 ? (
            <Pill tone='err'>
              {counts.fail} {counts.fail === 1 ? 'check' : 'checks'} failing
            </Pill>
          ) : (
            <Pill tone='ok'>Clean</Pill>
          )}
        </Cell>
      </div>

      {result.overallScore >= 90 && (
        <div className='mt-4 p-5 border border-[var(--border-hover)] rounded-xl bg-[var(--surface)]'>
          <p className='text-sm font-medium text-white'>
            Favicon not showing in Google?
          </p>
          <p className='text-sm text-[var(--muted)] mt-1.5 leading-relaxed'>
            Your favicon configuration looks good. If Google isn&apos;t displaying
            it yet, it may not have recrawled your site — this can take days to
            weeks.
          </p>
          <ul className='mt-3 space-y-1.5'>
            <li className='flex items-start gap-2 text-sm text-[var(--muted)]'>
              <span className='text-[var(--accent)] num'>1.</span>
              <span>
                Request indexing via{' '}
                <a
                  href='https://search.google.com/search-console'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-[var(--accent)] hover:text-[var(--accent-2)] inline-flex items-center gap-1'
                >
                  Google Search Console
                  <ExternalLink className='w-3 h-3' />
                </a>
              </span>
            </li>
            <li className='flex items-start gap-2 text-sm text-[var(--muted)]'>
              <span className='text-[var(--accent)] num'>2.</span>
              <span>
                Use the URL Inspection tool and click &quot;Request
                Indexing&quot; for your homepage
              </span>
            </li>
            <li className='flex items-start gap-2 text-sm text-[var(--muted)]'>
              <span className='text-[var(--accent)] num'>3.</span>
              <span>
                Ensure your favicon URL returns proper cache headers (avoid
                no-cache directives)
              </span>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}

function Cell({
  label,
  value,
  unit,
  children,
  noBorder,
}: {
  label: string;
  value: number;
  unit?: string;
  children?: React.ReactNode;
  noBorder?: boolean;
}) {
  return (
    <div
      className={cn(
        'px-5 py-5 md:py-6',
        !noBorder && 'md:border-l',
        'border-t md:border-t-0'
      )}
    >
      <div className='text-[11px] uppercase tracking-[0.08em] text-[var(--fg-faint)] font-medium'>
        {label}
      </div>
      <div className='mt-2.5 text-[32px] leading-none tracking-[-0.025em] font-[520] text-white num'>
        {value}
        {unit && (
          <span className='text-[15px] text-[var(--fg-faint)] ml-1 font-[460]'>
            {unit}
          </span>
        )}
      </div>
      {children && <div className='mt-2'>{children}</div>}
    </div>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: 'ok' | 'warn' | 'err';
  children: React.ReactNode;
}) {
  const toneMap = {
    ok: 'bg-[var(--success-muted)] text-[var(--success)] border-[color:rgba(76,183,130,0.22)]',
    warn: 'bg-[var(--warning-muted)] text-[var(--warning)] border-[color:rgba(242,201,76,0.22)]',
    err: 'bg-[var(--error-muted)] text-[var(--error)] border-[color:rgba(235,87,87,0.22)]',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border',
        toneMap[tone]
      )}
    >
      <span
        className='w-1 h-1 rounded-full'
        style={{ background: 'currentColor' }}
      />
      {children}
    </span>
  );
}
