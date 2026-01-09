'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [domain, setDomain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid unsubscribe link. No token provided.');
      return;
    }

    const unsubscribe = async () => {
      try {
        const response = await fetch('/api/monitor/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to unsubscribe');
        }

        setDomain(data.domain);
        setStatus('success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setStatus('error');
      }
    };

    unsubscribe();
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
        <h1 className="text-lg font-medium text-white mb-1">
          Processing
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Updating your preferences...
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <div className="w-10 h-10 rounded-full bg-[var(--error-muted)] flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-5 h-5 text-[var(--error)]" />
        </div>
        <h1 className="text-lg font-medium text-white mb-1">
          Unable to unsubscribe
        </h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          {error}
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 text-sm font-medium text-black bg-white rounded-lg hover:bg-white/90 transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-full bg-[var(--success)] flex items-center justify-center mx-auto mb-4">
        <Check className="w-5 h-5 text-black" />
      </div>
      <h1 className="text-lg font-medium text-white mb-1">
        Unsubscribed
      </h1>
      <p className="text-sm text-[var(--muted)] mb-1">
        Removed from alerts for <span className="font-mono text-white">{domain}</span>
      </p>
      <p className="text-xs text-[var(--muted)] mb-6">
        Your data will be deleted within 90 days.
      </p>
      <div className="flex gap-2 justify-center">
        <Link
          href="/"
          className="px-4 py-2 text-sm font-medium text-black bg-white rounded-lg hover:bg-white/90 transition-colors"
        >
          New Scan
        </Link>
        <Link
          href={`/?url=${encodeURIComponent(domain || '')}`}
          className="px-4 py-2 text-sm font-medium text-white bg-[var(--surface)] border rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
        >
          Resubscribe
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid">
      <div className="glow fixed inset-0 pointer-events-none" />
      <div className="relative max-w-sm w-full border rounded-lg bg-[var(--surface)] p-6">
        <Suspense fallback={
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
            <p className="text-sm text-[var(--muted)]">Loading...</p>
          </div>
        }>
          <UnsubscribeContent />
        </Suspense>
      </div>
    </div>
  );
}
