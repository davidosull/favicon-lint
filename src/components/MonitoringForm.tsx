'use client';

import { useState, FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonitoringFormProps {
  domain: string;
  onSuccess: (requiresVerification: boolean) => void;
  onCancel: () => void;
}

export function MonitoringForm({ domain, onSuccess, onCancel }: MonitoringFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/monitor/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, email: trimmedEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to subscribe');
      }

      onSuccess(data.requiresVerification ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={isLoading}
            className={cn(
              "flex-1 h-9 px-3 text-sm bg-[var(--surface)] text-white placeholder:text-[var(--muted)]",
              "border rounded",
              "transition-colors duration-150",
              "hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)]",
              "focus:bg-[var(--surface-hover)] focus:border-[var(--border-hover)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-[var(--error)]/50"
            )}
          />
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="h-9 px-2 text-[var(--muted)] hover:text-white transition-colors cursor-pointer sm:hidden"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "flex-1 sm:flex-none h-9 px-4 text-sm font-medium text-black bg-white rounded",
              "transition-colors duration-150",
              "hover:bg-white/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-1.5 cursor-pointer"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Subscribing</span>
              </>
            ) : (
              'Subscribe'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="hidden sm:flex h-9 px-2 text-[var(--muted)] hover:text-white transition-colors cursor-pointer items-center"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-[var(--error)]">{error}</p>}
    </form>
  );
}
