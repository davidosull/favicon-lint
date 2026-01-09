'use client';

export function Hero() {
  return (
    <div className="md:text-center">
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
        FaviconLint
      </h1>
      <p className="mt-4 text-lg text-[var(--muted)] max-w-xl md:mx-auto leading-relaxed">
        Check if your favicon is configured correctly across browsers and platforms.
      </p>
    </div>
  );
}
