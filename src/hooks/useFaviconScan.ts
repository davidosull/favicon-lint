'use client';

import { useState, useCallback } from 'react';
import type { ScanResult, RateLimitStatus } from '@/types';

type ScanStep = 'connecting' | 'parsing' | 'validating' | 'analyzing' | 'complete';

interface UseFaviconScanReturn {
  scan: (url: string, bypassCache?: boolean) => Promise<void>;
  result: ScanResult | null;
  error: string | null;
  isLoading: boolean;
  currentStep: ScanStep | null;
  rateLimits: RateLimitStatus | null;
  reset: () => void;
}

export function useFaviconScan(): UseFaviconScanReturn {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ScanStep | null>(null);
  const [rateLimits, setRateLimits] = useState<RateLimitStatus | null>(null);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
    setCurrentStep(null);
  }, []);

  const scan = useCallback(async (url: string, bypassCache = false) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentStep('connecting');

    try {
      setCurrentStep('parsing');

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, bypassCache })
      });

      setCurrentStep('validating');

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setRateLimits({
            allowed: false,
            hourlyRemaining: data.limits?.hourly?.remaining || 0,
            dailyRemaining: data.limits?.daily?.remaining || 0,
            retryAfter: data.retryAfter
          });
          throw new Error(data.message || 'Rate limit exceeded');
        }
        throw new Error(data.error || 'Failed to scan website');
      }

      setCurrentStep('analyzing');

      if (data.rateLimits) {
        setRateLimits({
          allowed: true,
          hourlyRemaining: data.rateLimits.hourlyRemaining,
          dailyRemaining: data.rateLimits.dailyRemaining
        });
      }

      setCurrentStep('complete');
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setCurrentStep(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    scan,
    result,
    error,
    isLoading,
    currentStep,
    rateLimits,
    reset
  };
}
