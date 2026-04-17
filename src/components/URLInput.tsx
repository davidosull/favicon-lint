'use client';

import { useState, FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEMO_URL = 'stripe.com';

interface URLInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function URLInput({ onSubmit, isLoading }: URLInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUrl = url.trim() || DEMO_URL;

    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;
    if (!urlPattern.test(trimmedUrl)) {
      setError('Please enter a valid website URL');
      return;
    }

    onSubmit(trimmedUrl);
  };

  return (
    <form onSubmit={handleSubmit} className='w-full'>
      <div
        className={cn(
          'flex items-center h-[52px] pr-1.5 pl-3.5 rounded-[10px] border transition-all duration-150',
          'bg-[var(--surface)] hover:bg-[var(--surface-2)]',
          focused
            ? 'border-[rgba(113,112,255,0.55)]'
            : 'border-[var(--border-hover)]',
          error && 'border-[var(--error)]/60'
        )}
        style={
          focused
            ? { boxShadow: '0 0 0 4px var(--accent-muted)' }
            : undefined
        }
      >
        <span className='text-[var(--fg-faint)] text-[15px] mr-1'>
          https://
        </span>
        <input
          type='text'
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError('');
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={DEMO_URL}
          disabled={isLoading}
          className={cn(
            'flex-1 min-w-0 bg-transparent border-0 outline-none text-[15px] text-white',
            'placeholder:text-[var(--fg-faint)]',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          style={{ boxShadow: 'none' }}
        />
        <button
          type='submit'
          disabled={isLoading}
          className={cn(
            'h-10 px-4 inline-flex items-center gap-2',
            'bg-white text-black rounded-[7px]',
            'text-[13px] font-medium',
            'transition-transform duration-150 ease-out hover:scale-[1.015]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
            'cursor-pointer'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className='w-4 h-4 animate-spin' />
              <span>Scanning</span>
            </>
          ) : (
            <span>Scan</span>
          )}
        </button>
      </div>

      {error && <p className='mt-2 text-sm text-[var(--error)]'>{error}</p>}
    </form>
  );
}
