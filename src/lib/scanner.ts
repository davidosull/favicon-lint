import * as cheerio from 'cheerio';
import {
  getFullUrl,
  normalizeDomain,
  calculateScore,
  formatBytes,
} from './utils';
import type {
  ScanResult,
  FaviconCheck,
  FaviconResult,
  CategoryResult,
  ManifestResult,
} from '@/types';
import { downloadForInspection, inspectImage } from './imageInspect';
import {
  fetchAndParseManifest,
  manifestHasIconSize,
  manifestHasMaskable,
} from './manifest';

interface FaviconReference {
  url: string;
  rel: string;
  type?: string;
  sizes?: string;
  media?: string;
  source: 'link' | 'meta' | 'default';
}

const SIZE_WARN_BYTES = 100 * 1024;
const SIZE_FAIL_BYTES = 250 * 1024;
const SIZE_INFO_BYTES = 50 * 1024;

export async function scanFavicons(url: string): Promise<ScanResult> {
  const fullUrl = getFullUrl(url);
  const domain = normalizeDomain(url);
  const baseUrl = new URL(fullUrl).origin;

  const html = await fetchWithTimeout(fullUrl, 10000);
  const $ = cheerio.load(html);

  const faviconRefs = extractFaviconReferences($, baseUrl);
  const defaultFaviconUrl = `${baseUrl}/favicon.ico`;

  if (!faviconRefs.some((f) => f.url === defaultFaviconUrl)) {
    faviconRefs.push({
      url: defaultFaviconUrl,
      rel: 'icon',
      source: 'default',
    });
  }

  const faviconResults = await Promise.all(
    faviconRefs.map((ref) => validateFavicon(ref))
  );

  const robotsResult = await checkRobotsTxt(baseUrl);

  // Manifest: if declared, fetch and parse
  const manifestHref = $('link[rel="manifest"]').attr('href');
  const manifest = manifestHref
    ? await fetchAndParseManifest(resolveUrl(manifestHref, baseUrl))
    : null;

  const categories = {
    basic: analyzeBasicChecks(faviconResults, faviconRefs),
    sizes: analyzeSizeChecks(faviconResults, faviconRefs),
    platforms: analyzePlatformChecks($, faviconRefs, faviconResults, manifest),
    accessibility: analyzeAccessibilityChecks(
      faviconResults,
      robotsResult
    ),
  };

  const allChecks = [
    ...categories.basic.checks,
    ...categories.sizes.checks,
    ...categories.platforms.checks,
    ...categories.accessibility.checks,
  ];

  const overallScore = calculateScore(allChecks);

  return {
    domain,
    scannedAt: new Date().toISOString(),
    overallScore,
    categories,
    favicons: faviconResults,
    fromCache: false,
  };
}

function extractFaviconReferences(
  $: cheerio.CheerioAPI,
  baseUrl: string
): FaviconReference[] {
  const refs: FaviconReference[] = [];

  $('link[rel*="icon"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      refs.push({
        url: resolveUrl(href, baseUrl),
        rel: $(el).attr('rel') || 'icon',
        type: $(el).attr('type'),
        sizes: $(el).attr('sizes'),
        media: $(el).attr('media'),
        source: 'link',
      });
    }
  });

  $('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]').each(
    (_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const url = resolveUrl(href, baseUrl);
        if (!refs.some((r) => r.url === url)) {
          refs.push({
            url,
            rel: $(el).attr('rel') || 'apple-touch-icon',
            sizes: $(el).attr('sizes'),
            source: 'link',
          });
        }
      }
    }
  );

  const msIcon = $('meta[name="msapplication-TileImage"]').attr('content');
  if (msIcon) {
    refs.push({
      url: resolveUrl(msIcon, baseUrl),
      rel: 'msapplication-TileImage',
      source: 'meta',
    });
  }

  return refs;
}

function resolveUrl(href: string, baseUrl: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  if (href.startsWith('//')) return 'https:' + href;
  if (href.startsWith('/')) return baseUrl + href;
  return baseUrl + '/' + href;
}

async function fetchWithTimeout(
  url: string,
  timeout: number
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'FaviconLint/1.0 (+https://faviconlint.com)' },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function validateFavicon(ref: FaviconReference): Promise<FaviconResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const downloaded = await downloadForInspection(ref.url, controller.signal);
    clearTimeout(timeoutId);

    if (!downloaded) {
      // Retry with a HEAD to capture status for a clearer error
      try {
        const head = await fetch(ref.url, { method: 'HEAD' });
        return {
          url: ref.url,
          accessible: false,
          httpStatus: head.status,
          rel: ref.rel,
          media: ref.media,
          declaredSizes: ref.sizes,
        };
      } catch {
        return {
          url: ref.url,
          accessible: false,
          rel: ref.rel,
          media: ref.media,
          declaredSizes: ref.sizes,
        };
      }
    }

    const { buffer, contentType, cacheControl, size } = downloaded;
    const image = await inspectImage(buffer, ref.url, contentType);

    let format = 'unknown';
    if (contentType.includes('ico') || ref.url.endsWith('.ico')) format = 'ico';
    else if (contentType.includes('png') || ref.url.endsWith('.png'))
      format = 'png';
    else if (contentType.includes('svg') || ref.url.endsWith('.svg'))
      format = 'svg';
    else if (contentType.includes('gif') || ref.url.endsWith('.gif'))
      format = 'gif';
    else if (
      contentType.includes('jpeg') ||
      contentType.includes('jpg') ||
      ref.url.endsWith('.jpg') ||
      ref.url.endsWith('.jpeg')
    )
      format = 'jpeg';
    else if (contentType.includes('webp') || ref.url.endsWith('.webp'))
      format = 'webp';

    // Prefer actual decoded dimensions over declared
    const dimensions =
      image.width && image.height
        ? { width: image.width, height: image.height }
        : ref.sizes && ref.sizes !== 'any'
        ? parseDeclaredSize(ref.sizes)
        : undefined;

    return {
      url: ref.url,
      size,
      dimensions,
      format,
      accessible: true,
      httpStatus: 200,
      rel: ref.rel,
      media: ref.media,
      declaredSizes: ref.sizes,
      cacheControl,
      image,
    };
  } catch {
    clearTimeout(timeoutId);
    return {
      url: ref.url,
      accessible: false,
      rel: ref.rel,
      media: ref.media,
      declaredSizes: ref.sizes,
    };
  }
}

function parseDeclaredSize(
  sizes: string
): { width: number; height: number } | undefined {
  const [width, height] = sizes.split('x').map(Number);
  if (width && height) return { width, height };
  return undefined;
}

async function checkRobotsTxt(
  baseUrl: string
): Promise<{ accessible: boolean; blocksFavicon: boolean; matchedRule?: string }> {
  try {
    const response = await fetchWithTimeout(`${baseUrl}/robots.txt`, 5000);
    const lower = response.toLowerCase();
    // Look for disallow rules that could affect favicons
    const patterns = [
      /disallow:\s*\/favicon/,
      /disallow:\s*\/?\*\.ico/,
      /disallow:\s*\/?\*\.png\$/,
    ];
    for (const pattern of patterns) {
      const match = lower.match(pattern);
      if (match) {
        return { accessible: true, blocksFavicon: true, matchedRule: match[0] };
      }
    }
    return { accessible: true, blocksFavicon: false };
  } catch {
    return { accessible: false, blocksFavicon: false };
  }
}

// ---------- helpers ----------

function getShortPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function hasLowMaxAge(cacheControl: string | null | undefined): boolean {
  if (!cacheControl) return true;
  if (/no-cache|no-store/i.test(cacheControl)) return true;
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  if (!maxAgeMatch) return true;
  // Less than 1 hour is low
  return parseInt(maxAgeMatch[1], 10) < 3600;
}

// ---------- check groups ----------

function analyzeBasicChecks(
  results: FaviconResult[],
  refs: FaviconReference[]
): CategoryResult {
  const checks: FaviconCheck[] = [];

  const defaultFavicon = results.find((r) => r.url.endsWith('/favicon.ico'));
  if (defaultFavicon?.accessible) {
    const sizeInfo = defaultFavicon.size
      ? ` (${formatBytes(defaultFavicon.size)})`
      : '';
    checks.push({
      id: 'favicon-ico',
      name: 'favicon.ico exists',
      description: 'The standard /favicon.ico file is accessible',
      status: 'pass',
      details: `/favicon.ico${sizeInfo}`,
    });
  } else {
    checks.push({
      id: 'favicon-ico',
      name: 'favicon.ico missing',
      description: 'The standard /favicon.ico file is not accessible',
      status: 'fail',
      details: defaultFavicon?.httpStatus
        ? `Returned HTTP ${defaultFavicon.httpStatus}`
        : 'Connection failed — file may not exist',
      recommendation: 'Add a favicon.ico file to your website root directory',
    });
  }

  const linkIcons = refs.filter((r) => r.source === 'link');
  if (linkIcons.length > 0) {
    const accessibleLinks = results.filter(
      (r) => r.accessible && linkIcons.find((ref) => ref.url === r.url)
    );
    if (accessibleLinks.length > 0) {
      const details = accessibleLinks.map((r) => {
        const declared = r.declaredSizes ? ` [${r.declaredSizes}]` : '';
        return `✓ ${getShortPath(r.url)}${declared}`;
      });
      checks.push({
        id: 'link-tags',
        name: 'Link tags present',
        description: 'Favicon declared using <link> tags in HTML',
        status: 'pass',
        details: details.join('\n'),
      });
    } else {
      checks.push({
        id: 'link-tags',
        name: 'Link tags inaccessible',
        description: 'Favicon link tags found but resources not accessible',
        status: 'warning',
        details: linkIcons.map((r) => `✗ ${getShortPath(r.url)}`).join('\n'),
        recommendation: 'Check that your favicon files are properly deployed',
      });
    }
  } else {
    checks.push({
      id: 'link-tags',
      name: 'No link tags',
      description: 'No favicon link tags found in HTML',
      status: 'warning',
      details: 'No <link rel="icon"> or similar tags detected in HTML head',
      recommendation: 'Add explicit favicon link tags for better browser support',
    });
  }

  const accessibleFavicons = results.filter((r) => r.accessible);
  if (accessibleFavicons.length > 0) {
    checks.push({
      id: 'any-favicon',
      name: 'Favicon available',
      description: 'At least one favicon is accessible',
      status: 'pass',
      details: `${accessibleFavicons.length} favicon(s) can be loaded by browsers`,
    });
  } else {
    checks.push({
      id: 'any-favicon',
      name: 'No accessible favicon',
      description: 'No favicon could be loaded',
      status: 'fail',
      details: 'Browsers will show a generic icon or blank tab',
      recommendation: 'Ensure at least one favicon file is accessible',
    });
  }

  return { name: 'Basic Checks', score: calculateScore(checks), checks };
}

function analyzeSizeChecks(
  results: FaviconResult[],
  refs: FaviconReference[]
): CategoryResult {
  const checks: FaviconCheck[] = [];
  const accessibleFavicons = results.filter((r) => r.accessible);

  if (accessibleFavicons.length === 0) {
    return {
      name: 'Size & Format',
      score: 0,
      checks: [
        {
          id: 'no-favicons',
          name: 'No favicons to analyze',
          description: 'Cannot check sizes without accessible favicons',
          status: 'fail',
          details: 'Fix accessibility issues first to enable size analysis',
        },
      ],
    };
  }

  // --- File size (tiered) ---
  const withSize = accessibleFavicons.filter((r) => r.size);
  const failing = withSize.filter((r) => r.size! > SIZE_FAIL_BYTES);
  const warning = withSize.filter(
    (r) => r.size! > SIZE_WARN_BYTES && r.size! <= SIZE_FAIL_BYTES
  );
  const info = withSize.filter(
    (r) => r.size! > SIZE_INFO_BYTES && r.size! <= SIZE_WARN_BYTES
  );

  if (failing.length > 0) {
    const details = failing
      .map((f) => `✗ ${getShortPath(f.url)} — ${formatBytes(f.size!)} (over 250KB)`)
      .join('\n');
    checks.push({
      id: 'file-size',
      name: 'Oversized favicon files',
      description: 'One or more favicons are much larger than they should be',
      status: 'fail',
      details,
      recommendation:
        'Re-export icons at the target size. Favicons should be under 100KB — ideally under 20KB.',
    });
  } else if (warning.length > 0) {
    checks.push({
      id: 'file-size',
      name: 'Large favicon files',
      description: 'Some favicons are larger than recommended',
      status: 'warning',
      details: warning
        .map((f) => `• ${getShortPath(f.url)} — ${formatBytes(f.size!)}`)
        .join('\n'),
      recommendation: 'Optimize favicons to be under 100KB for faster loading',
    });
  } else if (info.length > 0) {
    checks.push({
      id: 'file-size',
      name: 'Slightly heavy favicons',
      description: 'Some favicons are heavier than ideal, but within reason',
      status: 'info',
      details: info
        .map((f) => `• ${getShortPath(f.url)} — ${formatBytes(f.size!)}`)
        .join('\n'),
    });
  } else if (withSize.length > 0) {
    checks.push({
      id: 'file-size',
      name: 'File sizes OK',
      description: 'All favicon files are reasonably sized',
      status: 'pass',
      details: withSize
        .map((f) => `✓ ${getShortPath(f.url)} — ${formatBytes(f.size!)}`)
        .join('\n'),
    });
  }

  // --- Modern format ---
  const formats = new Set(
    accessibleFavicons.map((r) => r.format).filter(Boolean)
  );
  if (formats.has('png') || formats.has('svg')) {
    checks.push({
      id: 'modern-format',
      name: 'Modern format available',
      description: 'PNG or SVG favicon is available',
      status: 'pass',
    });
  } else if (formats.has('ico')) {
    checks.push({
      id: 'modern-format',
      name: 'Only ICO format',
      description: 'Add a PNG favicon for sharper rendering on high-DPI screens',
      status: 'info',
      recommendation: 'Add a PNG favicon at 32×32 or an SVG for modern browsers',
    });
  }

  // --- Declared vs actual size mismatch ---
  const declaredVsActualIssues = accessibleFavicons
    .filter((r) => r.declaredSizes && r.declaredSizes !== 'any' && r.image?.width)
    .map((r) => {
      const declared = parseDeclaredSize(r.declaredSizes!);
      if (!declared) return null;
      const aw = r.image!.width!;
      const ah = r.image!.height!;
      if (aw !== declared.width || ah !== declared.height) {
        return `✗ ${getShortPath(r.url)} — declared ${declared.width}×${declared.height}, actual ${aw}×${ah}`;
      }
      return null;
    })
    .filter((s): s is string => s !== null);

  if (declaredVsActualIssues.length > 0) {
    checks.push({
      id: 'declared-vs-actual',
      name: 'Declared sizes don\'t match actual',
      description:
        'HTML claims one size but the image file is different. Browsers pick icons using the declared size.',
      status: 'warning',
      details: declaredVsActualIssues.join('\n'),
      recommendation:
        'Update the sizes="" attribute to match the actual image dimensions, or re-export the image at the declared size.',
    });
  }

  // --- Non-square ---
  const nonSquare = accessibleFavicons
    .filter(
      (r) =>
        r.image?.width &&
        r.image?.height &&
        r.image.width !== r.image.height &&
        r.format !== 'svg'
    )
    .map(
      (r) =>
        `✗ ${getShortPath(r.url)} — ${r.image!.width}×${r.image!.height}`
    );

  if (nonSquare.length > 0) {
    checks.push({
      id: 'non-square',
      name: 'Non-square favicon',
      description:
        'Favicons should be square — browsers will scale or crop non-square icons',
      status: 'warning',
      details: nonSquare.join('\n'),
      recommendation: 'Re-export favicons as square (e.g. 32×32, 180×180)',
    });
  }

  // --- ICO contains multiple sizes ---
  const icoFile = accessibleFavicons.find(
    (r) => r.format === 'ico' && r.image?.icoSizes
  );
  if (icoFile) {
    const sizes = icoFile.image!.icoSizes!;
    const has16 = sizes.some((s) => s.startsWith('16x'));
    const has32 = sizes.some((s) => s.startsWith('32x'));
    if (has16 && has32) {
      checks.push({
        id: 'ico-multi-size',
        name: 'favicon.ico has 16×16 and 32×32',
        description: 'ICO contains multiple sizes for crisp rendering',
        status: 'pass',
        details: `Sizes inside: ${sizes.join(', ')}`,
      });
    } else {
      checks.push({
        id: 'ico-multi-size',
        name: 'favicon.ico is single-size',
        description: 'ICO files should embed 16×16 and 32×32 for best rendering',
        status: 'info',
        details: `Contains only: ${sizes.join(', ')}`,
        recommendation:
          'Re-generate favicon.ico with both 16×16 and 32×32 embedded',
      });
    }
  }

  return { name: 'Size & Format', score: calculateScore(checks), checks };
}

function analyzePlatformChecks(
  $: cheerio.CheerioAPI,
  refs: FaviconReference[],
  results: FaviconResult[],
  manifest: ManifestResult | null
): CategoryResult {
  const checks: FaviconCheck[] = [];

  // --- Apple Touch Icon ---
  const appleTouch = refs.find((r) => r.rel.includes('apple-touch-icon'));
  const appleTouchResult = appleTouch
    ? results.find((r) => r.url === appleTouch.url)
    : undefined;

  if (appleTouch && appleTouchResult?.accessible) {
    const dims = appleTouchResult.image;
    const is180 = dims?.width === 180 && dims?.height === 180;
    if (is180) {
      checks.push({
        id: 'apple-touch',
        name: 'Apple Touch Icon (180×180)',
        description: 'Icon for iOS home screen at the recommended size',
        status: 'pass',
        details: getShortPath(appleTouch.url),
      });
    } else if (dims?.width && dims?.height) {
      checks.push({
        id: 'apple-touch',
        name: `Apple Touch Icon is ${dims.width}×${dims.height}`,
        description: 'iOS 12+ expects 180×180 — will scale otherwise',
        status: 'warning',
        details: getShortPath(appleTouch.url),
        recommendation: 'Export apple-touch-icon at exactly 180×180',
      });
    } else {
      checks.push({
        id: 'apple-touch',
        name: 'Apple Touch Icon present',
        description: 'Icon for iOS home screen',
        status: 'pass',
        details: getShortPath(appleTouch.url),
      });
    }

    // Transparency check — iOS fills transparent pixels with black
    if (appleTouchResult.image?.hasAlpha) {
      checks.push({
        id: 'apple-touch-transparency',
        name: 'Apple Touch Icon has transparency',
        description:
          'iOS fills transparent pixels with black, which usually looks wrong',
        status: 'warning',
        recommendation: 'Flatten apple-touch-icon onto a solid background color',
      });
    }
  } else if (appleTouch) {
    checks.push({
      id: 'apple-touch',
      name: 'Apple Touch Icon inaccessible',
      description: 'Apple Touch Icon declared but not accessible',
      status: 'warning',
      recommendation: 'Ensure the apple-touch-icon file is deployed and reachable',
    });
  } else {
    checks.push({
      id: 'apple-touch',
      name: 'No Apple Touch Icon',
      description: 'Missing icon for iOS home screen',
      status: 'warning',
      recommendation:
        'Add <link rel="apple-touch-icon" href="/apple-touch-icon.png"> (180×180 PNG)',
    });
  }

  // --- Dark mode favicon ---
  const darkModeIcon = refs.find((r) =>
    (r.media || '').includes('prefers-color-scheme: dark')
  );
  if (darkModeIcon) {
    checks.push({
      id: 'dark-mode-favicon',
      name: 'Dark-mode favicon',
      description: 'A favicon variant is served for dark-mode browsers',
      status: 'pass',
      details: getShortPath(darkModeIcon.url),
    });
  } else {
    checks.push({
      id: 'dark-mode-favicon',
      name: 'No dark-mode favicon',
      description:
        'Consider a dark-mode variant — Safari and Chrome will serve it',
      status: 'info',
      recommendation:
        'Add <link rel="icon" media="(prefers-color-scheme: dark)" href="/favicon-dark.svg">',
    });
  }

  // --- Microsoft Tiles ---
  const msIcon = refs.find((r) => r.rel === 'msapplication-TileImage');
  const msConfig = $('meta[name="msapplication-config"]').attr('content');
  if (msIcon || msConfig) {
    checks.push({
      id: 'ms-tiles',
      name: 'Microsoft Tiles',
      description: 'Windows tile icons configured',
      status: 'pass',
    });
  } else {
    checks.push({
      id: 'ms-tiles',
      name: 'No Microsoft Tiles',
      description: 'Missing Windows tile configuration',
      status: 'info',
      recommendation: 'Add msapplication meta tags for Windows tiles',
    });
  }

  // --- Web App Manifest ---
  const manifestHref = $('link[rel="manifest"]').attr('href');
  if (!manifestHref) {
    checks.push({
      id: 'web-manifest',
      name: 'No Web App Manifest',
      description: 'No manifest linked — required for PWAs and Android install',
      status: 'warning',
      recommendation: 'Add <link rel="manifest" href="/site.webmanifest">',
    });
  } else if (!manifest?.accessible) {
    checks.push({
      id: 'web-manifest',
      name: 'Manifest inaccessible',
      description: 'Manifest file is linked but cannot be fetched',
      status: 'fail',
      details: manifestHref,
      recommendation: 'Check the manifest URL and deployment',
    });
  } else if (manifest.parseError) {
    checks.push({
      id: 'web-manifest',
      name: 'Manifest is not valid JSON',
      description: 'Manifest was fetched but failed to parse',
      status: 'fail',
      details: manifest.parseError,
      recommendation: 'Validate manifest.json with a JSON linter',
    });
  } else if (manifest.parsed) {
    checks.push({
      id: 'web-manifest',
      name: 'Web App Manifest valid',
      description: 'PWA manifest file present and parses',
      status: 'pass',
      details: manifest.url ? getShortPath(manifest.url) : undefined,
    });

    // Sub-checks on manifest contents
    const has192 = manifestHasIconSize(manifest, '192x192');
    const has512 = manifestHasIconSize(manifest, '512x512');
    if (has192 && has512) {
      checks.push({
        id: 'manifest-icons',
        name: 'Manifest has 192×192 and 512×512 icons',
        description: 'Required icon sizes for PWA install',
        status: 'pass',
      });
    } else {
      const missing = [];
      if (!has192) missing.push('192×192');
      if (!has512) missing.push('512×512');
      checks.push({
        id: 'manifest-icons',
        name: `Manifest missing ${missing.join(' and ')} icon(s)`,
        description: 'PWA install and Android require these sizes',
        status: 'warning',
        recommendation:
          'Add PNG icons at 192×192 and 512×512 to the manifest icons[] array',
      });
    }

    if (manifestHasMaskable(manifest)) {
      checks.push({
        id: 'manifest-maskable',
        name: 'Manifest has maskable icon',
        description: 'Android can render an adaptive (safe-zone) icon',
        status: 'pass',
      });
    } else {
      checks.push({
        id: 'manifest-maskable',
        name: 'No maskable icon in manifest',
        description:
          'Without a maskable icon, Android pads/crops your icon unpredictably',
        status: 'info',
        recommendation:
          'Add an icon with purpose: "maskable" and safe-zone padding',
      });
    }

    if (manifest.parsed.theme_color) {
      checks.push({
        id: 'manifest-theme-color',
        name: 'theme_color set',
        description: 'Sets the browser chrome color on Android',
        status: 'pass',
        details: `Color: ${manifest.parsed.theme_color}`,
      });
    } else {
      checks.push({
        id: 'manifest-theme-color',
        name: 'No theme_color in manifest',
        description: 'Missing theme_color leaves the address bar untinted',
        status: 'info',
        recommendation: 'Add "theme_color" to your manifest',
      });
    }

    if (!manifest.parsed.name && !manifest.parsed.short_name) {
      checks.push({
        id: 'manifest-name',
        name: 'Manifest missing name',
        description: 'Manifest needs at least one of name or short_name',
        status: 'warning',
        recommendation: 'Add "name" and "short_name" to manifest.json',
      });
    }
  }

  // --- <meta name="theme-color"> ---
  const themeColor = $('meta[name="theme-color"]').attr('content');
  if (themeColor) {
    checks.push({
      id: 'theme-color',
      name: 'theme-color meta tag',
      description: 'Browser chrome color set via <meta>',
      status: 'pass',
      details: `Color: ${themeColor}`,
    });
  }

  return { name: 'Platform Support', score: calculateScore(checks), checks };
}

function analyzeAccessibilityChecks(
  results: FaviconResult[],
  robotsResult: {
    accessible: boolean;
    blocksFavicon: boolean;
    matchedRule?: string;
  }
): CategoryResult {
  const checks: FaviconCheck[] = [];

  if (robotsResult.blocksFavicon) {
    checks.push({
      id: 'robots-txt',
      name: 'Blocked by robots.txt',
      description: 'robots.txt may be blocking favicon access',
      status: 'warning',
      details: robotsResult.matchedRule
        ? `Matched rule: ${robotsResult.matchedRule}`
        : undefined,
      recommendation:
        'Review robots.txt to ensure favicon paths are allowed (especially for Googlebot)',
    });
  } else {
    checks.push({
      id: 'robots-txt',
      name: 'Not blocked by robots.txt',
      description: 'Favicon paths are not blocked',
      status: 'pass',
    });
  }

  const accessible = results.filter((r) => r.accessible);
  const inaccessible = results.filter((r) => !r.accessible);
  const accessibleCount = accessible.length;
  const totalCount = results.length;

  if (accessibleCount === totalCount && totalCount > 0) {
    checks.push({
      id: 'all-accessible',
      name: 'All favicons accessible',
      description: 'All declared favicons can be loaded',
      status: 'pass',
      details: accessible.map((r) => `✓ ${getShortPath(r.url)}`).join('\n'),
    });
  } else if (accessibleCount > 0) {
    const rows = [
      ...accessible.map((r) => `✓ ${getShortPath(r.url)}`),
      ...inaccessible.map(
        (r) =>
          `✗ ${getShortPath(r.url)}${r.httpStatus ? ` (${r.httpStatus})` : ' (failed to load)'}`
      ),
    ];
    checks.push({
      id: 'all-accessible',
      name: 'Some favicons inaccessible',
      description: 'Not all declared favicons can be loaded',
      status: 'warning',
      details: rows.join('\n'),
      recommendation: 'Fix or remove broken favicon references',
    });
  } else {
    checks.push({
      id: 'all-accessible',
      name: 'No accessible favicons',
      description: 'None of the declared favicons can be loaded',
      status: 'fail',
      details: inaccessible
        .map(
          (r) =>
            `✗ ${getShortPath(r.url)}${r.httpStatus ? ` (${r.httpStatus})` : ' (failed to load)'}`
        )
        .join('\n'),
      recommendation: 'Check file paths and server configuration',
    });
  }

  const httpsOnly = results.every((r) => r.url.startsWith('https://'));
  if (httpsOnly) {
    checks.push({
      id: 'https',
      name: 'HTTPS URLs',
      description: 'All favicon URLs use HTTPS',
      status: 'pass',
    });
  } else {
    checks.push({
      id: 'https',
      name: 'Mixed HTTP/HTTPS',
      description: 'Some favicon URLs use HTTP',
      status: 'warning',
      details: results
        .filter((r) => r.url.startsWith('http://'))
        .map((r) => getShortPath(r.url))
        .join('\n'),
      recommendation: 'Use HTTPS for all favicon URLs',
    });
  }

  // --- Cache headers ---
  const withCache = results.filter(
    (r) => r.accessible && r.cacheControl !== undefined
  );
  if (withCache.length > 0) {
    const poor = withCache.filter((r) => hasLowMaxAge(r.cacheControl));
    if (poor.length === 0) {
      checks.push({
        id: 'cache-headers',
        name: 'Cache headers OK',
        description: 'Favicons have reasonable Cache-Control headers',
        status: 'pass',
      });
    } else {
      checks.push({
        id: 'cache-headers',
        name: 'Weak cache headers',
        description:
          'Favicons lack strong Cache-Control — browsers will re-request often',
        status: 'info',
        details: poor
          .map(
            (r) =>
              `• ${getShortPath(r.url)} — ${r.cacheControl || '(no Cache-Control)'}`
          )
          .join('\n'),
        recommendation:
          'Serve favicons with Cache-Control: public, max-age=604800 (7 days) or longer',
      });
    }
  }

  return { name: 'Accessibility', score: calculateScore(checks), checks };
}
