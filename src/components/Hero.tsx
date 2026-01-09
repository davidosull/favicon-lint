'use client';

export function Hero() {
  return (
    <div className="md:text-center">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
        Favicon not showing? <span className="text-[var(--accent)]">Find out why.</span>
      </h1>
      <p className="mt-4 text-lg text-[var(--muted)] max-w-xl md:mx-auto leading-relaxed">
        Scan your site and get actionable fixes in seconds.
      </p>
    </div>
  );
}
