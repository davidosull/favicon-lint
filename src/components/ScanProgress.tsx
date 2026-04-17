'use client';

import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ScanStep = 'connecting' | 'parsing' | 'validating' | 'analyzing' | 'complete';

interface ScanProgressProps {
  currentStep: ScanStep;
}

const steps = [
  { id: 'connecting', label: 'Connecting' },
  { id: 'parsing', label: 'Parsing HTML' },
  { id: 'validating', label: 'Validating' },
  { id: 'analyzing', label: 'Analyzing' },
] as const;

export function ScanProgress({ currentStep }: ScanProgressProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className='mt-6 p-5 border border-[var(--border-hover)] rounded-xl bg-[var(--surface)]'>
      <div className='flex items-center gap-2.5 text-sm text-white'>
        <Loader2 className='w-3.5 h-3.5 animate-spin text-[var(--accent)]' />
        <span>Scanning</span>
        <span className='text-[var(--fg-faint)]'>—</span>
        <span className='text-[var(--muted)]'>
          {steps[Math.max(0, currentIndex)]?.label ?? 'Working'}
        </span>
      </div>

      <div className='mt-4 flex items-center gap-2'>
        {steps.map((step, index) => {
          const isComplete =
            index < currentIndex || currentStep === 'complete';
          const isCurrent =
            index === currentIndex && currentStep !== 'complete';

          return (
            <div
              key={step.id}
              className='flex-1 flex items-center gap-2 min-w-0'
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200',
                  isComplete &&
                    'bg-[var(--success-muted)] text-[var(--success)]',
                  isCurrent &&
                    'bg-[var(--accent-muted)] text-[var(--accent)] ring-[3px] ring-[var(--accent-muted)]',
                  !isComplete && !isCurrent && 'bg-white/[0.04] border'
                )}
              >
                {isComplete && <Check className='w-2.5 h-2.5' />}
                {isCurrent && (
                  <span className='w-1.5 h-1.5 rounded-full bg-current' />
                )}
              </span>
              <span
                className={cn(
                  'text-[11px] truncate transition-colors',
                  isComplete && 'text-[var(--muted)]',
                  isCurrent && 'text-white',
                  !isComplete && !isCurrent && 'text-[var(--fg-faint)]'
                )}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    'flex-1 h-px transition-colors',
                    index < currentIndex
                      ? 'bg-[var(--success-muted)]'
                      : 'bg-[var(--border)]'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
