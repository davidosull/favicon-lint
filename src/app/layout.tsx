import type { Metadata, Viewport } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  axes: ['opsz'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#6967e6',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://faviconlint.com'),
  title: {
    default: 'FaviconLint — Favicon diagnostics',
    template: '%s | FaviconLint',
  },
  description:
    'Every place a favicon quietly fails. Paste a URL, see where yours does. Free, no sign-up.',
  keywords: [
    'favicon',
    'favicon checker',
    'favicon validator',
    'favicon lint',
    'favicon tester',
    'apple touch icon',
    'manifest.json',
    'pwa icon',
  ],
  authors: [{ name: 'FaviconLint' }],
  creator: 'FaviconLint',
  publisher: 'FaviconLint',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'FaviconLint — Favicon diagnostics',
    description:
      'Every place a favicon quietly fails. Paste a URL, see where yours does.',
    type: 'website',
    locale: 'en_US',
    url: 'https://faviconlint.com',
    siteName: 'FaviconLint',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FaviconLint — Favicon diagnostics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FaviconLint — Favicon diagnostics',
    description:
      'Every place a favicon quietly fails. Paste a URL, see where yours does.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        {/* Dark-mode favicon — Next's Metadata API doesn't pass `media` through */}
        <link
          rel='icon'
          type='image/svg+xml'
          media='(prefers-color-scheme: dark)'
          href='/favicon-dark.svg'
        />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
