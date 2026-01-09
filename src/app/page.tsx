'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { URLInput } from '@/components/URLInput';
import { ScanProgress } from '@/components/ScanProgress';
import { ResultsSummary } from '@/components/ResultsSummary';
import { CheckCategory } from '@/components/CheckCategory';
import { MonitoringCTA } from '@/components/MonitoringCTA';
import { Footer } from '@/components/Footer';
import { FAQ } from '@/components/FAQ';
import { useFaviconScan } from '@/hooks/useFaviconScan';
import { AlertTriangle, RotateCw, Loader2 } from 'lucide-react';

function HomeContent() {
  const searchParams = useSearchParams();
  const { scan, result, error, isLoading, currentStep, rateLimits } = useFaviconScan();
  const hasAutoScanned = useRef(false);

  // Auto-scan if URL is provided in query params
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam && !hasAutoScanned.current && !result && !isLoading) {
      hasAutoScanned.current = true;
      scan(urlParam);
    }
  }, [searchParams, scan, result, isLoading]);

  const handleScan = (url: string) => {
    scan(url);
  };

  const handleRefresh = () => {
    if (result) {
      scan(result.domain, true);
    }
  };

  return (
    <>
      <Hero />

      <div className="mt-8">
        <URLInput onSubmit={handleScan} isLoading={isLoading} />
      </div>

      {error && (
        <div className="mt-8 border border-[var(--error)]/30 rounded-lg p-4 bg-[var(--error-muted)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[var(--error)] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">Scan failed</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">{error}</p>
              {rateLimits && !rateLimits.allowed && rateLimits.retryAfter && (
                <p className="text-xs text-[var(--muted)] mt-1">
                  Try again in {Math.ceil(rateLimits.retryAfter / 60)} minutes.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading && currentStep && (
        <ScanProgress currentStep={currentStep} />
      )}

      {result && !isLoading && (
        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Results</h2>
            {result.fromCache && (
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-white transition-colors cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                Refresh
              </button>
            )}
          </div>

          <ResultsSummary result={result} />

          <div className="space-y-2">
            <CheckCategory category={result.categories.basic} defaultExpanded={true} />
            <CheckCategory category={result.categories.sizes} defaultExpanded={result.categories.sizes.score < 80} />
            <CheckCategory category={result.categories.platforms} defaultExpanded={result.categories.platforms.score < 80} />
            <CheckCategory category={result.categories.accessibility} defaultExpanded={result.categories.accessibility.score < 80} />
          </div>

          <MonitoringCTA domain={result.domain} currentScore={result.overallScore} />
        </div>
      )}

      {!result && !isLoading && !error && (
        <>
          <div className="mt-16 md:text-center">
            <p className="text-xs text-[var(--muted)] uppercase tracking-wide mb-4">What we check</p>
            <div className="flex flex-wrap md:justify-center gap-2">
              {[
                'favicon.ico',
                'HTML link tags',
                'Apple Touch icons',
                'Web manifest',
                'robots.txt',
                'File sizes'
              ].map((item) => (
                <span
                  key={item}
                  className="px-2.5 py-1 text-xs text-[var(--muted)] border rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div id="faq">
            <FAQ />
          </div>
        </>
      )}
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-[var(--muted)] animate-spin" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-grid">
      <div className="glow fixed inset-0 pointer-events-none" />
      <Header />

      <main className="flex-1 relative">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
          <Suspense fallback={<LoadingFallback />}>
            <HomeContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
