'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { URLInput } from '@/components/URLInput';
import { ScanProgress } from '@/components/ScanProgress';
import { ResultsSummary } from '@/components/ResultsSummary';
import { CheckCategory } from '@/components/CheckCategory';
import { Footer } from '@/components/Footer';
import { FAQ } from '@/components/FAQ';
import { useFaviconScan } from '@/hooks/useFaviconScan';
import { AlertTriangle, RotateCw, Loader2 } from 'lucide-react';

function HomeContent() {
  const searchParams = useSearchParams();
  const { scan, result, error, isLoading, currentStep, rateLimits } =
    useFaviconScan();
  const hasAutoScanned = useRef(false);

  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam && !hasAutoScanned.current && !result && !isLoading) {
      hasAutoScanned.current = true;
      scan(urlParam);
    }
  }, [searchParams, scan, result, isLoading]);

  const handleScan = (url: string) => scan(url);
  const handleRefresh = () => {
    if (result) scan(result.domain, true);
  };

  return (
    <>
      <Hero />

      <div className='mt-9'>
        <URLInput onSubmit={handleScan} isLoading={isLoading} />
      </div>

      <div className='mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--fg-faint)]'>
        <span>No sign-up</span>
        <span className='w-[3px] h-[3px] rounded-full bg-current opacity-60' />
        <span>10 scans / hour</span>
      </div>

      {error && (
        <div className='mt-6 border border-[var(--error)]/30 rounded-xl p-4 bg-[var(--error-muted)]'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='w-4 h-4 text-[var(--error)] mt-0.5 flex-shrink-0' />
            <div>
              <p className='text-sm font-medium text-white'>Scan failed</p>
              <p className='text-xs text-[var(--muted)] mt-0.5'>{error}</p>
              {rateLimits && !rateLimits.allowed && rateLimits.retryAfter && (
                <p className='text-xs text-[var(--muted)] mt-1'>
                  Try again in {Math.ceil(rateLimits.retryAfter / 60)} minutes.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading && currentStep && <ScanProgress currentStep={currentStep} />}

      {result && !isLoading && (
        <section className='mt-14'>
          <div className='flex items-baseline justify-between pb-3 mb-5 border-b'>
            <div className='text-[13px] font-[520] text-white'>
              Results{' '}
              <span className='font-[440] text-[var(--fg-faint)]'>
                — {result.domain}
              </span>
            </div>
            <div className='text-[12px] text-[var(--fg-faint)] flex items-center gap-2'>
              {result.fromCache && (
                <>
                  <span>Cached</span>
                  <span className='w-[3px] h-[3px] rounded-full bg-current opacity-60' />
                </>
              )}
              <button
                onClick={handleRefresh}
                className='inline-flex items-center gap-1.5 text-[13px] text-[var(--muted)] hover:text-white transition-colors cursor-pointer'
              >
                <RotateCw
                  className='w-3.5 h-3.5'
                  strokeWidth={1.75}
                  aria-hidden='true'
                />
                Refresh
              </button>
            </div>
          </div>

          <ResultsSummary result={result} />

          <div className='mt-5 border border-[var(--border-hover)] rounded-xl bg-[var(--surface)] overflow-hidden'>
            <CheckCategory
              category={result.categories.basic}
              defaultExpanded={true}
            />
            <CheckCategory
              category={result.categories.sizes}
              defaultExpanded={result.categories.sizes.score < 80}
            />
            <CheckCategory
              category={result.categories.platforms}
              defaultExpanded={result.categories.platforms.score < 80}
            />
            <CheckCategory
              category={result.categories.accessibility}
              defaultExpanded={result.categories.accessibility.score < 80}
              isLast
            />
          </div>
        </section>
      )}

      {!result && !isLoading && !error && (
        <>
          <div className='mt-16'>
            <p className='text-[11px] text-[var(--fg-faint)] uppercase tracking-[0.08em] mb-3 font-medium'>
              What we check
            </p>
            <div className='flex flex-wrap gap-2'>
              {[
                'favicon.ico',
                'HTML link tags',
                'Apple Touch icons',
                'Web manifest',
                'robots.txt',
                'File sizes',
              ].map((item) => (
                <span
                  key={item}
                  className='px-2.5 py-1 text-[12px] text-[var(--muted)] border border-[var(--border-hover)] rounded-full bg-[var(--surface)]'
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div id='faq'>
            <FAQ />
          </div>
        </>
      )}
    </>
  );
}

function LoadingFallback() {
  return (
    <div className='flex flex-col items-center justify-center py-20'>
      <Loader2 className='w-5 h-5 text-[var(--muted)] animate-spin' />
    </div>
  );
}

export default function Home() {
  return (
    <div className='min-h-screen flex flex-col relative'>
      <div className='aurora' aria-hidden='true' />
      <div className='noise' aria-hidden='true' />
      <Header />

      <main className='flex-1 relative z-[1]'>
        <div className='max-w-[960px] mx-auto px-5 md:px-7 pt-16 md:pt-22 pb-24'>
          <Suspense fallback={<LoadingFallback />}>
            <HomeContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
