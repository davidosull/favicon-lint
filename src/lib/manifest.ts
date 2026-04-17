import type { ManifestResult } from '@/types';

export async function fetchAndParseManifest(
  url: string,
  signal?: AbortSignal
): Promise<ManifestResult> {
  try {
    const response = await fetch(url, {
      signal,
      headers: { 'User-Agent': 'FaviconLint/1.0 (+https://faviconlint.com)' },
    });

    if (!response.ok) {
      return { url, accessible: false };
    }

    const text = await response.text();

    try {
      const parsed = JSON.parse(text);
      return {
        url,
        accessible: true,
        parsed: {
          name: typeof parsed.name === 'string' ? parsed.name : undefined,
          short_name:
            typeof parsed.short_name === 'string' ? parsed.short_name : undefined,
          theme_color:
            typeof parsed.theme_color === 'string' ? parsed.theme_color : undefined,
          background_color:
            typeof parsed.background_color === 'string'
              ? parsed.background_color
              : undefined,
          display: typeof parsed.display === 'string' ? parsed.display : undefined,
          icons: Array.isArray(parsed.icons)
            ? parsed.icons
                .filter(
                  (i: unknown): i is Record<string, unknown> =>
                    !!i && typeof i === 'object'
                )
                .map((i: Record<string, unknown>) => ({
                  src: typeof i.src === 'string' ? i.src : '',
                  sizes: typeof i.sizes === 'string' ? i.sizes : undefined,
                  type: typeof i.type === 'string' ? i.type : undefined,
                  purpose:
                    typeof i.purpose === 'string' ? i.purpose : undefined,
                }))
                .filter((i: { src: string }) => i.src)
            : undefined,
        },
      };
    } catch (parseErr) {
      return {
        url,
        accessible: true,
        parseError: parseErr instanceof Error ? parseErr.message : 'Invalid JSON',
      };
    }
  } catch {
    return { url, accessible: false };
  }
}

export function manifestHasIconSize(
  manifest: ManifestResult,
  targetSize: string
): boolean {
  if (!manifest.parsed?.icons) return false;
  return manifest.parsed.icons.some((icon) => {
    if (!icon.sizes) return false;
    return icon.sizes.split(/\s+/).some((s) => s === targetSize);
  });
}

export function manifestHasMaskable(manifest: ManifestResult): boolean {
  if (!manifest.parsed?.icons) return false;
  return manifest.parsed.icons.some((icon) =>
    (icon.purpose || '').split(/\s+/).includes('maskable')
  );
}
