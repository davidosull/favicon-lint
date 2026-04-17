'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaviconCheck } from '@/types';
import { cn } from '@/lib/utils';
import { CodeBlock } from './CodeBlock';

interface IssueCardProps {
  check: FaviconCheck;
}

const statusTone: Record<
  FaviconCheck['status'],
  { color: string; label: string }
> = {
  pass: { color: 'text-[var(--success)]', label: 'Pass' },
  fail: { color: 'text-[var(--error)]', label: 'Fail' },
  warning: { color: 'text-[var(--warning)]', label: 'Warn' },
  info: { color: 'text-[var(--accent)]', label: 'Info' },
};

const fixGuides: Record<string, { title: string; steps: string[]; code?: string }> = {
  'favicon-ico': {
    title: 'How to add favicon.ico',
    steps: [
      'Create a 32x32 pixel ICO file (can include 16x16 embedded)',
      'Name it exactly "favicon.ico"',
      "Place it in your website's root directory (e.g., public/ in Next.js)",
      'Add the link tag to your HTML <head> for explicit declaration',
    ],
    code: '<link rel="icon" href="/favicon.ico" sizes="32x32">',
  },
  'link-tags': {
    title: 'How to add favicon link tags',
    steps: [
      'Add link tags in your HTML <head> section',
      'Include multiple sizes for better browser support',
      'Use absolute paths starting with / for reliability',
    ],
    code: `<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
  },
  'any-favicon': {
    title: 'How to fix missing favicon',
    steps: [
      'Check that favicon files exist in your public/static folder',
      'Verify file permissions allow web server access',
      'Ensure your build process copies static assets',
      'Test the favicon URL directly in your browser',
    ],
  },
  'file-size': {
    title: 'How to optimize favicon size',
    steps: [
      'Use PNG for icons under 48x48, SVG for scalable icons',
      'Compress PNG files with tools like TinyPNG or ImageOptim',
      'Remove unnecessary metadata from image files',
      'Consider using ICO format only for legacy browser support',
    ],
  },
  'modern-format': {
    title: 'How to add modern favicon formats',
    steps: [
      'Create an SVG version of your favicon for perfect scaling',
      'Add PNG versions at 192x192 and 512x512 for PWA support',
      'Keep ICO as fallback for older browsers',
    ],
    code: `<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">`,
  },
  'apple-touch': {
    title: 'How to add Apple Touch Icon',
    steps: [
      'Create a 180x180 pixel PNG image',
      'Name it "apple-touch-icon.png"',
      'Place it in your root directory or specify the path',
      'No transparency - iOS will add rounded corners automatically',
    ],
    code: '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
  },
  'ms-tiles': {
    title: 'How to add Microsoft Tile icons',
    steps: [
      'Create tile images at 150x150 (medium) and 310x310 (large)',
      'Add meta tags to your HTML <head>',
      'Optionally create a browserconfig.xml for more control',
    ],
    code: `<meta name="msapplication-TileColor" content="#000000">
<meta name="msapplication-TileImage" content="/mstile-150x150.png">`,
  },
  'web-manifest': {
    title: 'How to add Web App Manifest',
    steps: [
      'Create a manifest.json or site.webmanifest file',
      'Include icons array with 192x192 and 512x512 PNG icons',
      'Add the manifest link to your HTML <head>',
      'Set name, short_name, and theme_color properties',
    ],
    code: '<link rel="manifest" href="/site.webmanifest">',
  },
  'robots-txt': {
    title: 'How to fix robots.txt blocking',
    steps: [
      'Open your robots.txt file',
      'Remove or modify rules blocking /favicon or icon paths',
      'Add explicit Allow rules for favicon files if needed',
      "Test with Google Search Console's robots.txt tester",
    ],
    code: `User-agent: *
Allow: /favicon.ico
Allow: /*.png$
Allow: /*.svg$`,
  },
  'all-accessible': {
    title: 'How to fix inaccessible favicons',
    steps: [
      'Check that all referenced files exist at the specified paths',
      'Verify file permissions (644 for files, 755 for directories)',
      'Ensure paths are correct (absolute vs relative)',
      'Check server logs for 404 or 403 errors',
      'Test each favicon URL directly in your browser',
    ],
  },
  https: {
    title: 'How to fix mixed content',
    steps: [
      'Update all favicon URLs to use https:// or protocol-relative //',
      'Better yet, use root-relative paths starting with /',
      'Ensure your SSL certificate is valid and covers all assets',
    ],
    code: `<!-- Use root-relative paths -->
<link rel="icon" href="/favicon.ico">

<!-- Or protocol-relative (less recommended) -->
<link rel="icon" href="//example.com/favicon.ico">`,
  },
  'declared-vs-actual': {
    title: 'Fix declared size vs actual size mismatch',
    steps: [
      'Browsers pick icons based on the declared sizes="" attribute',
      'If the actual PNG is a different size, the browser rescales it — blurry',
      'Either re-export the PNG at the size you declared, or update the sizes attribute to match the real dimensions',
      'Use one declaration per actual size — don\'t declare sizes you don\'t serve',
    ],
    code: `<!-- If your file is really 32×32: -->
<link rel="icon" href="/favicon-32.png" sizes="32x32">`,
  },
  'non-square': {
    title: 'Fix non-square favicon',
    steps: [
      'Favicons should be square — browsers will stretch or crop non-square images',
      'Re-export the icon at a square ratio (1:1)',
      'Common target sizes: 32×32 for browsers, 180×180 for Apple, 192/512 for Android',
    ],
  },
  'apple-touch-transparency': {
    title: 'Remove transparency from apple-touch-icon',
    steps: [
      'iOS fills transparent pixels with pure black — rarely what you want',
      'Open the source PNG and flatten it onto a solid background that matches your brand',
      'Export at 180×180 without an alpha channel',
      'Tools: ImageMagick, Photoshop "Flatten image", or sharp({ background }).flatten()',
    ],
    code: `# ImageMagick
convert apple-touch-icon.png \\
  -background "#111" -flatten \\
  -resize 180x180 apple-touch-icon.png`,
  },
  'dark-mode-favicon': {
    title: 'Add a dark-mode favicon',
    steps: [
      'Safari and Chrome support serving a different favicon in dark mode',
      'Export a version of your icon that reads well on dark backgrounds',
      'Declare both variants with a media query',
    ],
    code: `<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon"
  media="(prefers-color-scheme: dark)"
  href="/favicon-dark.svg"
  type="image/svg+xml">`,
  },
  'manifest-icons': {
    title: 'Add required manifest icons',
    steps: [
      'PWA installs and Android home-screen need 192×192 and 512×512 PNG icons',
      'Export both sizes from your source icon',
      'Reference them in the manifest icons[] array',
    ],
    code: `{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}`,
  },
  'manifest-maskable': {
    title: 'Add a maskable icon',
    steps: [
      'Android adaptive icons crop into a shape — without a maskable variant, Android pads and crops unpredictably',
      'Design a 512×512 PNG where the important content fits inside the inner 80% safe zone',
      'Reference it in the manifest with purpose: "maskable"',
      'Preview at maskable.app before shipping',
    ],
    code: `{
  "src": "/icon-maskable-512.png",
  "sizes": "512x512",
  "type": "image/png",
  "purpose": "maskable"
}`,
  },
  'manifest-name': {
    title: 'Add name and short_name to manifest',
    steps: [
      'name: the full app name shown under the icon',
      'short_name: fallback used on home screens with limited space (12 chars)',
      'Both are required for a valid installable PWA',
    ],
    code: `{
  "name": "Your App",
  "short_name": "App"
}`,
  },
  'cache-headers': {
    title: 'Serve favicons with long cache headers',
    steps: [
      'Favicons rarely change — browsers should cache them aggressively',
      'Set a Cache-Control header with max-age of at least a week',
      'Configure this at your CDN, framework, or web server level',
    ],
    code: `# Example: 7 days
Cache-Control: public, max-age=604800, immutable`,
  },
};

export function IssueCard({ check }: IssueCardProps) {
  const [showGuide, setShowGuide] = useState(false);
  const tone = statusTone[check.status];
  const guide = fixGuides[check.id];
  const hasGuide = guide && (check.status === 'fail' || check.status === 'warning');

  return (
    <div className='grid grid-cols-[16px_1fr_auto] gap-3 py-2.5 border-b border-dashed border-[var(--border)] last:border-b-0 items-baseline'>
      <span className={cn('text-lg leading-none', tone.color)}>●</span>
      <div className='min-w-0'>
        <div className='text-[13px] text-white leading-snug'>{check.name}</div>
        {check.description && (
          <div className='text-[12.5px] text-[var(--muted)] mt-0.5 leading-snug'>
            {check.description}
          </div>
        )}

        {check.details && (
          <div className='mt-2 font-mono text-[12px] text-[var(--muted)] space-y-0.5 break-all'>
            {check.details.split('\n').map((line, i) => (
              <div key={i}>
                {line.startsWith('✓') ? (
                  <>
                    <span className='text-[var(--success)]'>✓</span>
                    {line.slice(1)}
                  </>
                ) : (
                  line
                )}
              </div>
            ))}
          </div>
        )}

        {check.recommendation && (
          <p className='mt-2 text-[12.5px] text-[var(--muted)] pl-3 border-l-2 border-[var(--border-hover)] leading-relaxed'>
            {check.recommendation}
          </p>
        )}

        {hasGuide && (
          <button
            onClick={() => setShowGuide(!showGuide)}
            className='mt-2 inline-flex items-center gap-1 text-[12px] text-[var(--accent)] hover:text-[var(--accent-2)] transition-colors cursor-pointer'
          >
            <span>How to fix</span>
            <ChevronDown
              className={cn(
                'w-3 h-3 transition-transform duration-150',
                showGuide && 'rotate-180'
              )}
            />
          </button>
        )}

        {hasGuide && showGuide && (
          <div className='mt-2.5 p-3 rounded-lg border bg-[var(--surface)]'>
            <p className='text-[13px] font-medium text-white mb-2'>
              {guide.title}
            </p>
            <ol className='text-[12.5px] text-[var(--muted)] space-y-1 list-decimal list-inside leading-relaxed'>
              {guide.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            {guide.code && <CodeBlock code={guide.code} />}
          </div>
        )}
      </div>
      {!hasGuide && (
        <span className='text-[11px] text-[var(--fg-faint)] self-baseline'>
          {tone.label}
        </span>
      )}
    </div>
  );
}
