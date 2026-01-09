'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Check, AlertTriangle, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [domain, setDomain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid verification link. No token provided.');
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch('/api/monitor/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (response.status === 410) {
          setStatus('expired');
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || 'Failed to verify');
        }

        setDomain(data.domain);
        setStatus('success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setStatus('error');
      }
    };

    verify();
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
        <h1 className="text-lg font-medium text-white mb-1">
          Verifying
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Confirming your email address...
        </p>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="text-center">
        <div className="w-10 h-10 rounded-full bg-[var(--warning-muted)] flex items-center justify-center mx-auto mb-4">
          <Clock className="w-5 h-5 text-[var(--warning)]" />
        </div>
        <h1 className="text-lg font-medium text-white mb-1">
          Link expired
        </h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          This verification link has expired. Please subscribe again to receive a new link.
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

  if (status === 'error') {
    return (
      <div className="text-center">
        <div className="w-10 h-10 rounded-full bg-[var(--error-muted)] flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-5 h-5 text-[var(--error)]" />
        </div>
        <h1 className="text-lg font-medium text-white mb-1">
          Verification failed
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
        You&apos;re all set!
      </h1>
      <p className="text-sm text-[var(--muted)] mb-1">
        Now monitoring <span className="font-mono text-white">{domain}</span>
      </p>
      <p className="text-xs text-[var(--muted)] mb-6">
        We&apos;ll email you when favicon issues are detected or resolved.
      </p>
      <Link
        href={`/?url=${encodeURIComponent(domain || '')}`}
        className="inline-block px-4 py-2 text-sm font-medium text-black bg-white rounded-lg hover:bg-white/90 transition-colors"
      >
        View Current Report
      </Link>
    </div>
  );
}

export default function VerifyPage() {
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
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
