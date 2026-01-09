import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for FaviconLint favicon checker tool.',
};

export default function PrivacyPage() {
  return (
    <div className='min-h-screen flex flex-col bg-grid'>
      <div className='glow fixed inset-0 pointer-events-none' />
      <Header />

      <main className='flex-1 relative'>
        <div className='max-w-3xl mx-auto px-4 py-16'>
          <h1 className='text-3xl font-semibold text-white mb-2'>
            Privacy Policy
          </h1>
          <p className='text-sm text-[var(--muted)] mb-8'>
            Last updated: January 2025
          </p>

          <div className='prose prose-invert prose-sm max-w-none space-y-8'>
            <section>
              <h2 className='text-lg font-medium text-white mb-3'>Overview</h2>
              <p className='text-[var(--muted)] leading-relaxed'>
                FaviconLint is a free tool that checks favicon configurations
                for websites. We are committed to protecting your privacy and
                being transparent about what data we collect and how we use it.
              </p>
            </section>

            <section>
              <h2 className='text-lg font-medium text-white mb-3'>
                Data We Collect
              </h2>

              <h3 className='text-sm font-medium text-white mt-4 mb-2'>
                Scan Data
              </h3>
              <p className='text-[var(--muted)] leading-relaxed'>
                When you scan a website, we temporarily cache the scan results
                to improve performance. This includes the domain name and
                favicon analysis results. Cached data is automatically deleted
                after 24 hours.
              </p>

              <h3 className='text-sm font-medium text-white mt-4 mb-2'>
                Monitoring Subscriptions
              </h3>
              <p className='text-[var(--muted)] leading-relaxed'>
                If you subscribe to monitoring alerts, we store:
              </p>
              <ul className='list-disc list-inside text-[var(--muted)] mt-2 space-y-1'>
                <li>Your email address (to send alerts)</li>
                <li>A hash of your email (for lookup purposes)</li>
                <li>The domain you are monitoring</li>
                <li>Your monitoring preferences</li>
              </ul>
              <p className='text-[var(--muted)] leading-relaxed mt-2'>
                You can unsubscribe at any time using the link in any alert
                email. Your data will be deleted within 90 days of
                unsubscribing.
              </p>

              <h3 className='text-sm font-medium text-white mt-4 mb-2'>
                Rate Limiting
              </h3>
              <p className='text-[var(--muted)] leading-relaxed'>
                To prevent abuse, we store a hash of your IP address to enforce
                rate limits. This data is automatically deleted after 24 hours
                and cannot be used to identify you personally.
              </p>
            </section>

            <section>
              <h2 className='text-lg font-medium text-white mb-3'>
                How We Use Your Data
              </h2>
              <p className='text-[var(--muted)] leading-relaxed'>
                We use your data solely to provide the FaviconLint service:
              </p>
              <ul className='list-disc list-inside text-[var(--muted)] mt-2 space-y-1'>
                <li>To perform favicon scans and return results</li>
                <li>To send monitoring alerts when you subscribe</li>
                <li>To prevent abuse through rate limiting</li>
              </ul>
              <p className='text-[var(--muted)] leading-relaxed mt-2'>
                We do not sell, share, or use your data for advertising
                purposes.
              </p>
            </section>

            <section>
              <h2 className='text-lg font-medium text-white mb-3'>
                Data Storage
              </h2>
              <p className='text-[var(--muted)] leading-relaxed'>
                Your data is stored securely using Supabase, with servers
                located in the United States. All data is encrypted in transit
                and at rest.
              </p>
            </section>

            <section>
              <h2 className='text-lg font-medium text-white mb-3'>
                Your Rights
              </h2>
              <p className='text-[var(--muted)] leading-relaxed'>
                You have the right to:
              </p>
              <ul className='list-disc list-inside text-[var(--muted)] mt-2 space-y-1'>
                <li>Unsubscribe from monitoring alerts at any time</li>
                <li>Request deletion of your data</li>
                <li>Request a copy of your data</li>
              </ul>
              <p className='text-[var(--muted)] leading-relaxed mt-2'>
                To exercise these rights, please contact us at hello@osull.io.
              </p>
            </section>

            <section>
              <h2 className='text-lg font-medium text-white mb-3'>
                Third-Party Services
              </h2>
              <p className='text-[var(--muted)] leading-relaxed'>
                We use the following third-party services:
              </p>
              <ul className='list-disc list-inside text-[var(--muted)] mt-2 space-y-1'>
                <li>Supabase - Database hosting</li>
                <li>AWS SES - Email delivery</li>
                <li>Vercel - Application hosting</li>
              </ul>
            </section>

            <section>
              <h2 className='text-lg font-medium text-white mb-3'>
                Changes to This Policy
              </h2>
              <p className='text-[var(--muted)] leading-relaxed'>
                We may update this privacy policy from time to time. We will
                notify monitoring subscribers of any significant changes via
                email.
              </p>
            </section>

            <section>
              <h2 className='text-lg font-medium text-white mb-3'>Contact</h2>
              <p className='text-[var(--muted)] leading-relaxed'>
                If you have any questions about this privacy policy, please
                contact us at hello@osull.io.
              </p>
            </section>
          </div>

          <div className='mt-12 pt-8 border-t'>
            <Link
              href='/'
              className='inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-white transition-colors'
            >
              <ArrowLeft className='w-4 h-4' />
              Back to FaviconLint
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
