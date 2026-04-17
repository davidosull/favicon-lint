'use client';

export function Hero() {
  return (
    <div>
      <span className='inline-flex items-center gap-2 pl-2 pr-2.5 py-1 text-xs text-[var(--fg-dim)] bg-[var(--surface)] border border-[var(--border-hover)] rounded-full mb-5'>
        <span
          className='w-1.5 h-1.5 rounded-full bg-[var(--accent)]'
          style={{ boxShadow: '0 0 0 3px var(--accent-muted)' }}
          aria-hidden='true'
        />
        20+ checks · no sign-up · instant
      </span>

      <h1 className='text-4xl md:text-5xl leading-[1.08] tracking-[-0.032em] font-[560] text-white'>
        Your favicon works on your laptop.
        <br />
        <span className='accent-line'>
          It&apos;s broken on half your users&apos; devices.
        </span>
      </h1>

      <p className='mt-5 max-w-2xl text-[var(--fg-dim)] text-base md:text-lg leading-relaxed'>
        iOS, Android, Windows tiles, dark mode, the manifest, the robots file
        — every place a favicon quietly fails. Paste a URL, see where yours
        does.
      </p>
    </div>
  );
}
