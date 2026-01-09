'use client';

import { useState } from 'react';
import { Check, X, AlertTriangle, Info, ChevronDown } from 'lucide-react';
import type { FaviconCheck } from '@/types';
import { cn } from '@/lib/utils';
import { CodeBlock } from './CodeBlock';

interface IssueCardProps {
  check: FaviconCheck;
}

const statusConfig = {
  pass: {
    icon: Check,
    color: 'text-[var(--success)]',
  },
  fail: {
    icon: X,
    color: 'text-[var(--error)]',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-[var(--warning)]',
  },
  info: {
    icon: Info,
    color: 'text-[var(--accent)]',
  }
};

const fixGuides: Record<string, { title: string; steps: string[]; code?: string }> = {
  'favicon-ico': {
    title: 'How to add favicon.ico',
    steps: [
      'Create a 32x32 pixel ICO file (can include 16x16 embedded)',
      'Name it exactly "favicon.ico"',
      'Place it in your website\'s root directory (e.g., public/ in Next.js)',
      'Add the link tag to your HTML <head> for explicit declaration'
    ],
    code: '<link rel="icon" href="/favicon.ico" sizes="32x32">'
  },
  'link-tags': {
    title: 'How to add favicon link tags',
    steps: [
      'Add link tags in your HTML <head> section',
      'Include multiple sizes for better browser support',
      'Use absolute paths starting with / for reliability'
    ],
    code: `<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
  },
  'any-favicon': {
    title: 'How to fix missing favicon',
    steps: [
      'Check that favicon files exist in your public/static folder',
      'Verify file permissions allow web server access',
      'Ensure your build process copies static assets',
      'Test the favicon URL directly in your browser'
    ]
  },
  'file-size': {
    title: 'How to optimize favicon size',
    steps: [
      'Use PNG for icons under 48x48, SVG for scalable icons',
      'Compress PNG files with tools like TinyPNG or ImageOptim',
      'Remove unnecessary metadata from image files',
      'Consider using ICO format only for legacy browser support'
    ]
  },
  'modern-format': {
    title: 'How to add modern favicon formats',
    steps: [
      'Create an SVG version of your favicon for perfect scaling',
      'Add PNG versions at 192x192 and 512x512 for PWA support',
      'Keep ICO as fallback for older browsers'
    ],
    code: `<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">`
  },
  'apple-touch': {
    title: 'How to add Apple Touch Icon',
    steps: [
      'Create a 180x180 pixel PNG image',
      'Name it "apple-touch-icon.png"',
      'Place it in your root directory or specify the path',
      'No transparency - iOS will add rounded corners automatically'
    ],
    code: '<link rel="apple-touch-icon" href="/apple-touch-icon.png">'
  },
  'ms-tiles': {
    title: 'How to add Microsoft Tile icons',
    steps: [
      'Create tile images at 150x150 (medium) and 310x310 (large)',
      'Add meta tags to your HTML <head>',
      'Optionally create a browserconfig.xml for more control'
    ],
    code: `<meta name="msapplication-TileColor" content="#000000">
<meta name="msapplication-TileImage" content="/mstile-150x150.png">`
  },
  'web-manifest': {
    title: 'How to add Web App Manifest',
    steps: [
      'Create a manifest.json or site.webmanifest file',
      'Include icons array with 192x192 and 512x512 PNG icons',
      'Add the manifest link to your HTML <head>',
      'Set name, short_name, and theme_color properties'
    ],
    code: '<link rel="manifest" href="/site.webmanifest">'
  },
  'robots-txt': {
    title: 'How to fix robots.txt blocking',
    steps: [
      'Open your robots.txt file',
      'Remove or modify rules blocking /favicon or icon paths',
      'Add explicit Allow rules for favicon files if needed',
      'Test with Google Search Console\'s robots.txt tester'
    ],
    code: `User-agent: *
Allow: /favicon.ico
Allow: /*.png$
Allow: /*.svg$`
  },
  'all-accessible': {
    title: 'How to fix inaccessible favicons',
    steps: [
      'Check that all referenced files exist at the specified paths',
      'Verify file permissions (644 for files, 755 for directories)',
      'Ensure paths are correct (absolute vs relative)',
      'Check server logs for 404 or 403 errors',
      'Test each favicon URL directly in your browser'
    ]
  },
  'https': {
    title: 'How to fix mixed content',
    steps: [
      'Update all favicon URLs to use https:// or protocol-relative //',
      'Better yet, use root-relative paths starting with /',
      'Ensure your SSL certificate is valid and covers all assets'
    ],
    code: `<!-- Use root-relative paths -->
<link rel="icon" href="/favicon.ico">

<!-- Or protocol-relative (less recommended) -->
<link rel="icon" href="//example.com/favicon.ico">`
  }
};

export function IssueCard({ check }: IssueCardProps) {
  const [showGuide, setShowGuide] = useState(false);
  const config = statusConfig[check.status];
  const Icon = config.icon;
  const guide = fixGuides[check.id];
  const hasGuide = guide && (check.status === 'fail' || check.status === 'warning');

  return (
    <div className="px-4 py-3 border-b last:border-b-0 hover:bg-[var(--surface)] transition-colors">
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5", config.color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">{check.name}</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">{check.description}</p>

          {check.details && (
            <pre className="text-xs text-[var(--muted)] mt-2 font-mono bg-[var(--surface)] px-2 py-1.5 rounded whitespace-pre-wrap">
              {check.details}
            </pre>
          )}

          {check.recommendation && (
            <p className="text-xs text-[var(--muted)] mt-2 pl-3 border-l-2 border-[var(--border)]">
              {check.recommendation}
            </p>
          )}

          {hasGuide && (
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="mt-2 flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors cursor-pointer"
            >
              <span>How to fix</span>
              <ChevronDown className={cn(
                "w-3 h-3 transition-transform duration-200",
                showGuide && "rotate-180"
              )} />
            </button>
          )}

          {hasGuide && showGuide && (
            <div className="mt-3 p-3 bg-[var(--surface)] rounded-lg border">
              <p className="text-xs font-medium text-white mb-2">{guide.title}</p>
              <ol className="text-xs text-[var(--muted)] space-y-1.5 list-decimal list-inside">
                {guide.steps.map((step, i) => (
                  <li key={i} className="leading-relaxed">{step}</li>
                ))}
              </ol>
              {guide.code && (
                <CodeBlock code={guide.code} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
