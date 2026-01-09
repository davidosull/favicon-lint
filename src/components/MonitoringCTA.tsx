'use client';

import { Bell, Check, Mail } from 'lucide-react';
import { useState } from 'react';
import { MonitoringForm } from './MonitoringForm';

interface MonitoringCTAProps {
  domain: string;
  currentScore: number;
}

export function MonitoringCTA({ domain }: MonitoringCTAProps) {
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'verified'>('idle');

  if (status === 'pending') {
    return (
      <div className="border border-[var(--accent)]/30 rounded-lg p-4 bg-[var(--accent-muted)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Check your email</p>
            <p className="text-xs text-[var(--muted)]">
              Click the link to verify and start monitoring.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'verified') {
    return (
      <div className="border rounded-lg p-4 bg-[var(--success-muted)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--success)] flex items-center justify-center">
            <Check className="w-4 h-4 text-black" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Monitoring active</p>
            <p className="text-xs text-[var(--muted)]">
              We&apos;ll email you when issues are detected.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[var(--accent)]/30 rounded-lg p-5 bg-[var(--accent-muted)]">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-base font-medium text-white">Monitor this site</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            Get email alerts when favicon issues are detected or resolved. No account required.
          </p>

          {showForm ? (
            <div className="mt-4">
              <MonitoringForm
                domain={domain}
                onSuccess={(requiresVerification) => {
                  setStatus(requiresVerification ? 'pending' : 'verified');
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors cursor-pointer"
            >
              Set up alerts
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
