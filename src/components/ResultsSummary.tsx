'use client';

import { useState } from 'react';
import { Check, X, AlertTriangle, Clock, ExternalLink, ImageOff } from 'lucide-react';
import type { ScanResult, FaviconResult } from '@/types';
import { cn } from '@/lib/utils';

interface ResultsSummaryProps {
  result: ScanResult;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-[var(--success)]';
  if (score >= 60) return 'text-[var(--warning)]';
  return 'text-[var(--error)]';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Critical';
}

function getBestFavicon(favicons: FaviconResult[]): FaviconResult | null {
  const accessible = favicons.filter(f => f.accessible);
  if (accessible.length === 0) return null;

  // Prefer PNG/SVG over ICO for display, and prefer sizes around 32-64px
  const ranked = accessible.sort((a, b) => {
    // Prefer SVG
    if (a.format === 'svg' && b.format !== 'svg') return -1;
    if (b.format === 'svg' && a.format !== 'svg') return 1;

    // Prefer PNG over ICO
    if (a.format === 'png' && b.format === 'ico') return -1;
    if (b.format === 'png' && a.format === 'ico') return 1;

    // Prefer sizes between 32-64px
    const aSize = a.dimensions?.width || 0;
    const bSize = b.dimensions?.width || 0;
    const aIdeal = aSize >= 32 && aSize <= 64;
    const bIdeal = bSize >= 32 && bSize <= 64;
    if (aIdeal && !bIdeal) return -1;
    if (bIdeal && !aIdeal) return 1;

    return 0;
  });

  return ranked[0];
}

export function ResultsSummary({ result }: ResultsSummaryProps) {
  const [faviconError, setFaviconError] = useState(false);
  const bestFavicon = getBestFavicon(result.favicons);

  const allChecks = [
    ...result.categories.basic.checks,
    ...result.categories.sizes.checks,
    ...result.categories.platforms.checks,
    ...result.categories.accessibility.checks
  ];

  const counts = {
    pass: allChecks.filter(c => c.status === 'pass').length,
    warning: allChecks.filter(c => c.status === 'warning').length,
    fail: allChecks.filter(c => c.status === 'fail').length,
  };

  return (
    <div className="border rounded-lg p-6 bg-[var(--surface)]">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={cn("text-5xl font-semibold tabular-nums", getScoreColor(result.overallScore))}>
              {result.overallScore}<span className="text-2xl text-[var(--muted)]">/100</span>
            </div>
            <div className="text-xs text-[var(--muted)] mt-1 uppercase tracking-wide">
              {getScoreLabel(result.overallScore)}
            </div>
          </div>

          <div className="h-16 w-px bg-[var(--border)]" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--background)] border flex items-center justify-center overflow-hidden">
              {bestFavicon && !faviconError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={bestFavicon.url}
                  alt={`${result.domain} favicon`}
                  className="w-8 h-8 object-contain"
                  onError={() => setFaviconError(true)}
                />
              ) : (
                <ImageOff className="w-4 h-4 text-[var(--muted)]" />
              )}
            </div>
            <div>
              <div className="font-mono text-sm text-white mb-1">{result.domain}</div>
              {result.fromCache && (
                <div className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Cached</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 md:ml-auto">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-5 h-5 rounded-full bg-[var(--success-muted)] flex items-center justify-center">
              <Check className="w-3 h-3 text-[var(--success)]" />
            </div>
            <span className="text-[var(--muted)]">{counts.pass}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-5 h-5 rounded-full bg-[var(--warning-muted)] flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-[var(--warning)]" />
            </div>
            <span className="text-[var(--muted)]">{counts.warning}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-5 h-5 rounded-full bg-[var(--error-muted)] flex items-center justify-center">
              <X className="w-3 h-3 text-[var(--error)]" />
            </div>
            <span className="text-[var(--muted)]">{counts.fail}</span>
          </div>
        </div>
      </div>

      {result.overallScore >= 90 && (
        <div className="mt-5 pt-5 border-t border-[var(--border)]">
          <p className="text-sm text-white font-medium">
            Favicon not showing in Google?
          </p>
          <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">
            Your favicon configuration looks good. If Google isn&apos;t displaying it yet, they may not have recrawled your site. This can take days to weeks.
          </p>
          <div className="mt-3 space-y-2">
            <p className="text-sm text-[var(--muted)]">To speed up the process:</p>
            <ul className="text-sm text-[var(--muted)] space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)]">1.</span>
                <span>
                  Request indexing via{' '}
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    Google Search Console
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)]">2.</span>
                <span>Use the URL Inspection tool and click &quot;Request Indexing&quot; for your homepage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)]">3.</span>
                <span>Ensure your favicon URL returns proper cache headers (avoid no-cache directives)</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
