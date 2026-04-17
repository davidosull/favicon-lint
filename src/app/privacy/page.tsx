import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata = {
  title: 'Privacy — FaviconLint',
  description: 'What FaviconLint stores, and why.',
};

export default function PrivacyPage() {
  return (
    <div className='min-h-screen flex flex-col relative'>
      <div className='aurora' aria-hidden='true' />
      <div className='noise' aria-hidden='true' />
      <Header />

      <main className='flex-1 relative z-[1]'>
        <div className='max-w-2xl mx-auto px-5 md:px-7 py-16'>
          <h1 className='text-3xl font-semibold text-white mb-2'>Privacy</h1>
          <p className='text-sm text-[var(--muted)] mb-10'>
            Short version: we don't want your data and don't collect more than
            we need to run the tool.
          </p>

          <div className='space-y-6 text-[var(--muted)] leading-relaxed text-sm'>
            <p>
              When you scan a domain, we cache the result for 6 hours keyed on
              the domain name. No account, no tracking, no cookies.
            </p>
            <p>
              To stop abuse, we store a one-way hash of your IP address against
              a scan counter for rate limiting. The raw IP is never written to
              disk. Rate-limit rows are purged daily.
            </p>
            <p>
              We keep a minimal anonymous log of each scan (domain, score,
              timestamp, hashed IP) for debugging and basic usage stats. Nothing
              is shared with third parties and nothing is used for advertising.
            </p>
            <p>
              Data lives in Supabase (EU region). Email to reach us:{' '}
              <a
                href='mailto:hello@osull.io'
                className='text-white hover:underline'
              >
                hello@osull.io
              </a>
              .
            </p>
          </div>

          <div className='mt-12 pt-8 border-t'>
            <Link
              href='/'
              className='inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-white transition-colors'
            >
              <ArrowLeft className='w-4 h-4' />
              Back
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
