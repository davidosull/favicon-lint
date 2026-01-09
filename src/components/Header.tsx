'use client';

import Image from 'next/image';

export function Header() {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = '/';
  };

  return (
    <header className='border-b'>
      <div className='max-w-3xl mx-auto px-4 py-3 flex items-center'>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href='/'
          onClick={handleClick}
          className='inline-block hover:opacity-80 transition-opacity'
        >
          <Image
            src='/logo.svg'
            alt='FaviconLint'
            width={120}
            height={24}
            className='h-6 w-auto'
            priority
          />
        </a>
      </div>
    </header>
  );
}
