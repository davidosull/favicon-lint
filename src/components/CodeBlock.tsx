'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language?: 'html' | 'xml' | 'json' | 'text' | 'bash';
}

// Custom theme based on oneDark but with transparency for our dark UI
const customTheme = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: 'transparent',
    margin: 0,
    padding: 0,
    fontSize: '12px',
    lineHeight: '1.5',
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    fontSize: '12px',
    lineHeight: '1.5',
  },
};

export function CodeBlock({ code, language = 'html' }: CodeBlockProps) {
  // Auto-detect language from content
  const detectedLanguage = detectLanguage(code, language);

  return (
    <div className="mt-3 p-3 bg-[var(--surface)] border rounded text-xs overflow-x-auto">
      <SyntaxHighlighter
        language={detectedLanguage}
        style={customTheme}
        customStyle={{
          background: 'transparent',
          margin: 0,
          padding: 0,
        }}
        codeTagProps={{
          style: {
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          }
        }}
      >
        {code.trim()}
      </SyntaxHighlighter>
    </div>
  );
}

function detectLanguage(code: string, fallback: string): string {
  const trimmed = code.trim();

  // HTML/XML detection
  if (trimmed.startsWith('<') && (trimmed.includes('</') || trimmed.includes('/>'))) {
    return 'html';
  }

  // JSON detection
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return 'json';
  }

  // robots.txt / config file detection
  if (trimmed.includes('User-agent:') || trimmed.includes('Allow:') || trimmed.includes('Disallow:')) {
    return 'text';
  }

  return fallback;
}
