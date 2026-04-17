'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodeBlock } from './CodeBlock';

const faqs = [
  {
    question: "Why isn't my favicon showing in the browser tab?",
    answer: "The most common causes are: the favicon.ico file is missing from your root directory, the file path in your HTML is incorrect, or your browser has cached an old version. Make sure you have a favicon.ico at your domain root (e.g., example.com/favicon.ico) and add a link tag in your HTML head. Try clearing your browser cache or testing in incognito mode.",
    code: '<link rel="icon" href="/favicon.ico">',
  },
  {
    question: 'What favicon sizes do I need?',
    answer:
      'At minimum, you need a 32x32 pixel favicon.ico for browsers. For full coverage across all platforms and devices, you should include multiple sizes.',
    list: [
      '16x16 and 32x32 ICO for browsers',
      '180x180 PNG for Apple devices',
      '192x192 and 512x512 PNG for Android/PWA',
      '150x150 PNG for Windows tiles',
    ],
  },
  {
    question: 'How do I add an Apple Touch icon?',
    answer:
      "Create a 180x180 pixel PNG image and reference it in your HTML head. This icon appears when users add your site to their iOS home screen. Place the file in your root directory for automatic discovery, or specify the path explicitly. Important: don't use transparency as iOS will fill it with black.",
    code: '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
  },
  {
    question: 'What is a web app manifest?',
    answer:
      "A web app manifest (manifest.json or site.webmanifest) is a JSON file that defines how your site appears when installed as a Progressive Web App (PWA). It specifies icons, theme colors, display mode, and other settings. While not required for basic favicon functionality, it's essential for PWAs and improves the experience on Android devices.",
    code: '<link rel="manifest" href="/site.webmanifest">',
  },
  {
    question: 'Why does my favicon work locally but not in production?',
    answer:
      'This is usually caused by path issues or caching. Check these common causes:',
    list: [
      'Incorrect file paths (relative vs absolute)',
      'Case sensitivity issues on Linux servers',
      'CDN caching serving old files',
      'Build process not copying static assets',
    ],
  },
  {
    question: 'Can robots.txt block my favicon?',
    answer:
      "Yes. If your robots.txt disallows crawling of your favicon path, search engines like Google won't be able to fetch and display your favicon in search results. Check for rules like 'Disallow: /*.ico' or 'Disallow: /images/' that might block favicon access. You can add explicit Allow rules to fix this.",
    code: `User-agent: *
Allow: /favicon.ico
Allow: /*.png$`,
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          faq.answer +
          (faq.list ? ' ' + faq.list.join('. ') : '') +
          (faq.code ? ' Example: ' + faq.code : ''),
      },
    })),
  };

  return (
    <section className='mt-20'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      <div className='flex items-baseline justify-between pb-3 mb-5 border-b'>
        <h2 className='text-[13px] font-[520] text-white'>Common questions</h2>
        <span className='text-[12px] text-[var(--fg-faint)]'>
          {faqs.length} answers
        </span>
      </div>

      <div className='border border-[var(--border-hover)] rounded-xl bg-[var(--surface)] overflow-hidden'>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={index < faqs.length - 1 ? 'border-b' : ''}
            >
              <button
                onClick={() => toggle(index)}
                className='w-full px-4 py-3.5 flex items-start justify-between gap-4 text-left hover:bg-[var(--surface-2)] transition-colors duration-150 cursor-pointer'
              >
                <span className='text-[13.5px] font-[460] text-white leading-snug'>
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-[var(--fg-faint)] flex-shrink-0 mt-1 transition-transform duration-150',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>
              {isOpen && (
                <div className='px-4 pb-4 bg-[var(--bg-elev)]'>
                  <p className='text-[13px] text-[var(--muted)] leading-relaxed'>
                    {faq.answer}
                  </p>
                  {faq.list && (
                    <ul className='mt-3 space-y-1'>
                      {faq.list.map((item, i) => (
                        <li
                          key={i}
                          className='text-[13px] text-[var(--muted)] flex items-start gap-2'
                        >
                          <span className='text-[var(--accent)]'>•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  {faq.code && <CodeBlock code={faq.code} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
