'use client';

import { Check } from 'lucide-react';
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
];

export function ScanProgress({ currentStep }: ScanProgressProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full max-w-md mx-auto py-12">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex || currentStep === 'complete';
          const isCurrent = index === currentIndex && currentStep !== 'complete';

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                    isComplete && "bg-[var(--success)] text-black",
                    isCurrent && "bg-white text-black",
                    !isComplete && !isCurrent && "bg-[var(--surface)] text-[var(--muted)] border"
                  )}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs transition-colors duration-300",
                    isComplete && "text-[var(--success)]",
                    isCurrent && "text-white",
                    !isComplete && !isCurrent && "text-[var(--muted)]"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-12 h-px mx-2 transition-colors duration-300",
                    index < currentIndex ? "bg-[var(--success)]" : "bg-[var(--border)]"
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
