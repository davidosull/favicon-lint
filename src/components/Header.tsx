'use client';

export function Header() {
  return (
    <header className='sticky top-0 z-10 backdrop-blur-md bg-[rgba(8,9,10,0.72)] border-b'>
      <div className='max-w-[960px] mx-auto px-5 md:px-7 py-3.5 flex items-center'>
        <a
          href='/'
          className='flex items-center gap-2.5 text-sm font-medium tracking-tight hover:opacity-90 transition-opacity'
        >
          <span
            className='brand-mark w-[22px] h-[22px] rounded-md'
            aria-hidden='true'
          />
          <span className='text-white'>FaviconLint</span>
          <span
            className='inline-block w-1 h-1 rounded-full bg-[var(--fg-faint)] mx-1.5'
            aria-hidden='true'
          />
          <span className='text-[var(--muted)] font-normal'>
            Favicon diagnostics
          </span>
        </a>
      </div>
    </header>
  );
}
