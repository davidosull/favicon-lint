import type { NextConfig } from 'next';

// Long cache for static favicon assets. Favicons rarely change,
// so a 30-day TTL with immutable is safe and hits every scanner's
// cache-header check cleanly.
const FAVICON_CACHE = 'public, max-age=2592000, immutable';
const MANIFEST_CACHE = 'public, max-age=86400';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [{ key: 'Cache-Control', value: FAVICON_CACHE }],
      },
      {
        source: '/favicon.svg',
        headers: [{ key: 'Cache-Control', value: FAVICON_CACHE }],
      },
      {
        source: '/favicon-dark.svg',
        headers: [{ key: 'Cache-Control', value: FAVICON_CACHE }],
      },
      {
        source: '/favicon-:size.png',
        headers: [{ key: 'Cache-Control', value: FAVICON_CACHE }],
      },
      {
        source: '/apple-touch-icon.png',
        headers: [{ key: 'Cache-Control', value: FAVICON_CACHE }],
      },
      {
        source: '/icon-:size.png',
        headers: [{ key: 'Cache-Control', value: FAVICON_CACHE }],
      },
      {
        source: '/icon-maskable-:size.png',
        headers: [{ key: 'Cache-Control', value: FAVICON_CACHE }],
      },
      {
        source: '/site.webmanifest',
        headers: [{ key: 'Cache-Control', value: MANIFEST_CACHE }],
      },
    ];
  },
};

export default nextConfig;
