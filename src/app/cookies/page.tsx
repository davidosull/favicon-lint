import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata = {
  title: 'Cookie Policy',
  description: 'Cookie policy for FaviconLint favicon checker tool.',
};

export default function CookiesPage() {
  return (
    <div className='min-h-screen flex flex-col bg-grid'>
      <div className='glow fixed inset-0 pointer-events-none' />
      <Header />

      <main className='flex-1 relative'>
        <div className='max-w-3xl mx-auto px-4 py-16'>
          <h1 className='text-3xl font-semibold text-white mb-2'>
            Cookie Policy
          </h1>
          <p className='text-sm text-[var(--muted)] mb-8'>
            Last updated: January 2025
          </p>

          <div className='prose prose-invert prose-sm max-w-none space-y-8'>
            <section>
              <h2 className='text-lg font-medium text-white mb-3'>
                What Are Cookies
              </h2>
              <p className='text-[var(--muted)] leading-relaxed'>
                Cookies are small text files that are stored on your device when
                you visit a website. They are widely used to make websites work
                more efficiently and provide information to website owners.
              </p>
            </section>

            <section>
              <h2 className='text-lg font-medium text-white mb-3'>
                How We Use Cookies
              </h2>
              <p className='text-[var(--muted)] leading-relaxed'>
                FaviconLint uses minimal cookies to provide essential
                functionality. We do not use cookies for advertising or tracking
                purposes.
              </p>
            </section>

            <section>
              <h2 className='text-lg font-medium text-white mb-3'>
                Cookies We Use
              </h2>

              <div className='mt-4 border rounded-lg overflow-hidden'>
                <table className='w-full text-sm'>
                  <thead className='bg-[var(--surface)]'>
                    <tr>
                      <th className='px-4 py-3 text-left text-white font-medium'>
                        Cookie
                      </th>
                      <th className='px-4 py-3 text-left text-white font-medium'>
                        Purpose
                      </th>
                      <th className='px-4 py-3 text-left text-white font-medium'>
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-[var(--border)]'>
                    <tr>
                      <td className='px-4 py-3 text-[var(--muted)] font-mono text-xs'>
                        Essential
                      </td>
                      <td className='px-4 py-3 text-[var(--muted)]'>
                        Required for the website to function
                      </td>
                      <td className='px-4 py-3 text-[var(--muted)]'>Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className='text-[var(--muted)] leading-relaxed mt-4'>
                We do not use any third-party analytics, advertising, or social
                media cookies.
              </p>
            </section>

            <section>
              <h2 className='text-lg font-medium text-white mb-3'>
                Local Storage
              </h2>
              <p className='text-[var(--muted)] leading-relaxed'>
                In addition to cookies, we may use local storage to save your
                preferences and improve your experience. This data is stored
                only on your device and is not transmitted to our servers.
              </p>
            </section>

            <section>
              <h2 className='text-lg font-medium text-white mb-3'>
                Managing Cookies
              </h2>
              <p className='text-[var(--muted)] leading-relaxed'>
                You can control and manage cookies through your browser
                settings. Please note that disabling cookies may affect the
                functionality of the website.
              </p>
              <p className='text-[var(--muted)] leading-relaxed mt-2'>
                Most browsers allow you to:
              </p>
              <ul className='list-disc list-inside text-[var(--muted)] mt-2 space-y-1'>
                <li>
                  View what cookies are stored and delete them individually
                </li>
                <li>Block third-party cookies</li>
                <li>Block cookies from specific sites</li>
                <li>Block all cookies</li>
                <li>Delete all cookies when you close your browser</li>
              </ul>
            </section>

            <section>
              <h2 className='text-lg font-medium text-white mb-3'>
                Changes to This Policy
              </h2>
              <p className='text-[var(--muted)] leading-relaxed'>
                We may update this cookie policy from time to time. Any changes
                will be posted on this page with an updated revision date.
              </p>
            </section>

            <section>
              <h2 className='text-lg font-medium text-white mb-3'>Contact</h2>
              <p className='text-[var(--muted)] leading-relaxed'>
                If you have any questions about our use of cookies, please
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
