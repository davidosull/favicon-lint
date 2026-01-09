'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t mt-auto">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted)]">
          <span>&copy; {currentYear} FaviconLint. All rights reserved.</span>

          <nav className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/cookies"
              className="hover:text-white transition-colors"
            >
              Cookie Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
