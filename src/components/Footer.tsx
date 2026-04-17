'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className='border-t mt-auto'>
      <div className='max-w-[960px] mx-auto px-5 md:px-7 py-5'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted)]'>
          <span>
            FaviconLint — built by{' '}
            <a
              href='https://osull.io'
              target='_blank'
              rel='noopener noreferrer'
              className='hover:text-white transition-colors'
            >
              osull.io
            </a>
          </span>

          <Link
            href='/privacy'
            className='hover:text-white transition-colors'
          >
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
