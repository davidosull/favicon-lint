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
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('weekly');
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
        body: JSON.stringify({ domain, email: trimmedEmail, frequency })
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={isLoading}
          className={cn(
            "w-full h-9 px-3 text-sm bg-[var(--surface)] text-white placeholder:text-[var(--muted)]",
            "border rounded",
            "transition-colors duration-150",
            "hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)]",
            "focus:bg-[var(--surface-hover)] focus:border-[var(--border-hover)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-[var(--error)]/50"
          )}
        />
        {error && <p className="mt-1 text-xs text-[var(--error)]">{error}</p>}
      </div>

      <div className="flex gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="frequency"
            checked={frequency === 'daily'}
            onChange={() => setFrequency('daily')}
            disabled={isLoading}
            className="w-3.5 h-3.5 text-white bg-[var(--surface)] border-[var(--border)]"
          />
          <span className="text-xs text-[var(--muted)]">Daily</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="frequency"
            checked={frequency === 'weekly'}
            onChange={() => setFrequency('weekly')}
            disabled={isLoading}
            className="w-3.5 h-3.5 text-white bg-[var(--surface)] border-[var(--border)]"
          />
          <span className="text-xs text-[var(--muted)]">Weekly</span>
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "flex-1 h-8 px-3 text-xs font-medium text-black bg-white rounded",
            "transition-colors duration-150",
            "hover:bg-white/90",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center justify-center gap-1.5 cursor-pointer"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
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
          className="h-8 px-2 text-[var(--muted)] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
