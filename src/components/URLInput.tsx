'use client';

import { useState, FormEvent } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface URLInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function URLInput({ onSubmit, isLoading }: URLInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please enter a URL');
      return;
    }

    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;
    if (!urlPattern.test(trimmedUrl)) {
      setError('Please enter a valid website URL');
      return;
    }

    onSubmit(trimmedUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl md:mx-auto">
      <div className="relative">
        <div className="flex">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            placeholder="example.com"
            disabled={isLoading}
            className={cn(
              "flex-1 h-12 px-4 bg-[var(--surface)] text-white placeholder:text-[var(--muted)]",
              "border border-r-0 rounded-l-lg",
              "transition-colors duration-150",
              "hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)]",
              "focus:bg-[var(--surface-hover)] focus:border-[var(--border-hover)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "font-mono text-sm",
              error && "border-[var(--error)]/50"
            )}
          />
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "h-12 px-5 bg-white text-black font-medium rounded-r-lg",
              "transition-all duration-150",
              "hover:bg-white/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2 text-sm cursor-pointer"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scanning</span>
              </>
            ) : (
              <>
                <span>Scan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-[var(--error)]">{error}</p>
        )}
      </div>
    </form>
  );
}
