'use client';

import { Github } from 'lucide-react';

interface FooterProps {
  rateLimits?: {
    hourlyRemaining: number;
    dailyRemaining: number;
  };
}

export function Footer({ rateLimits }: FooterProps) {
  return (
    <footer className="border-t mt-auto">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
          <span>FaviconLint</span>

          {rateLimits && (
            <span className="tabular-nums">
              {rateLimits.hourlyRemaining} scans remaining
            </span>
          )}

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
