import * as cheerio from 'cheerio';
import { getFullUrl, normalizeDomain, calculateScore, formatBytes } from './utils';
import type { ScanResult, FaviconCheck, FaviconResult, CategoryResult } from '@/types';

interface FaviconReference {
  url: string;
  rel: string;
  type?: string;
  sizes?: string;
  source: 'link' | 'meta' | 'default';
}

export async function scanFavicons(url: string): Promise<ScanResult> {
  const fullUrl = getFullUrl(url);
  const domain = normalizeDomain(url);
  const baseUrl = new URL(fullUrl).origin;

  const html = await fetchWithTimeout(fullUrl, 10000);
  const $ = cheerio.load(html);

  const faviconRefs = extractFaviconReferences($, baseUrl);
  const defaultFaviconUrl = `${baseUrl}/favicon.ico`;

  if (!faviconRefs.some(f => f.url === defaultFaviconUrl)) {
    faviconRefs.push({
      url: defaultFaviconUrl,
      rel: 'icon',
      source: 'default'
    });
  }

  const faviconResults = await Promise.all(
    faviconRefs.map(ref => validateFavicon(ref))
  );

  const robotsResult = await checkRobotsTxt(baseUrl);

  const categories = {
    basic: analyzeBasicChecks(faviconResults, faviconRefs),
    sizes: analyzeSizeChecks(faviconResults),
    platforms: analyzePlatformChecks($, faviconRefs, faviconResults),
    accessibility: analyzeAccessibilityChecks(faviconResults, robotsResult)
  };

  const allChecks = [
    ...categories.basic.checks,
    ...categories.sizes.checks,
    ...categories.platforms.checks,
    ...categories.accessibility.checks
  ];

  const overallScore = calculateScore(allChecks);

  return {
    domain,
    scannedAt: new Date().toISOString(),
    overallScore,
    categories,
    favicons: faviconResults,
    fromCache: false
  };
}

function extractFaviconReferences($: cheerio.CheerioAPI, baseUrl: string): FaviconReference[] {
  const refs: FaviconReference[] = [];

  $('link[rel*="icon"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      refs.push({
        url: resolveUrl(href, baseUrl),
        rel: $(el).attr('rel') || 'icon',
        type: $(el).attr('type'),
        sizes: $(el).attr('sizes'),
        source: 'link'
      });
    }
  });

  $('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      const url = resolveUrl(href, baseUrl);
      if (!refs.some(r => r.url === url)) {
        refs.push({
          url,
          rel: $(el).attr('rel') || 'apple-touch-icon',
          sizes: $(el).attr('sizes'),
          source: 'link'
        });
      }
    }
  });

  const msIcon = $('meta[name="msapplication-TileImage"]').attr('content');
  if (msIcon) {
    refs.push({
      url: resolveUrl(msIcon, baseUrl),
      rel: 'msapplication-TileImage',
      source: 'meta'
    });
  }

  return refs;
}

function resolveUrl(href: string, baseUrl: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  if (href.startsWith('//')) {
    return 'https:' + href;
  }
  if (href.startsWith('/')) {
    return baseUrl + href;
  }
  return baseUrl + '/' + href;
}

async function fetchWithTimeout(url: string, timeout: number): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'FaviconLint/1.0 (+https://faviconlint.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function validateFavicon(ref: FaviconReference): Promise<FaviconResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(ref.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'FaviconLint/1.0 (+https://faviconlint.com)'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        url: ref.url,
        accessible: false,
        httpStatus: response.status
      };
    }

    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length');
    const size = contentLength ? parseInt(contentLength, 10) : undefined;

    let format = 'unknown';
    if (contentType.includes('ico') || ref.url.endsWith('.ico')) {
      format = 'ico';
    } else if (contentType.includes('png') || ref.url.endsWith('.png')) {
      format = 'png';
    } else if (contentType.includes('svg') || ref.url.endsWith('.svg')) {
      format = 'svg';
    } else if (contentType.includes('gif') || ref.url.endsWith('.gif')) {
      format = 'gif';
    } else if (contentType.includes('jpeg') || contentType.includes('jpg') || ref.url.endsWith('.jpg') || ref.url.endsWith('.jpeg')) {
      format = 'jpeg';
    } else if (contentType.includes('webp') || ref.url.endsWith('.webp')) {
      format = 'webp';
    }

    let dimensions: { width: number; height: number } | undefined;
    if (ref.sizes && ref.sizes !== 'any') {
      const [width, height] = ref.sizes.split('x').map(Number);
      if (width && height) {
        dimensions = { width, height };
      }
    }

    return {
      url: ref.url,
      size,
      dimensions,
      format,
      accessible: true,
      httpStatus: response.status
    };
  } catch (error) {
    return {
      url: ref.url,
      accessible: false
    };
  }
}

async function checkRobotsTxt(baseUrl: string): Promise<{ accessible: boolean; blocksFavicon: boolean }> {
  try {
    const response = await fetchWithTimeout(`${baseUrl}/robots.txt`, 5000);
    const blocksFavicon = response.toLowerCase().includes('disallow: /favicon');
    return { accessible: true, blocksFavicon };
  } catch {
    return { accessible: false, blocksFavicon: false };
  }
}

function analyzeBasicChecks(results: FaviconResult[], refs: FaviconReference[]): CategoryResult {
  const checks: FaviconCheck[] = [];

  const getShortPath = (url: string) => {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  };

  const defaultFavicon = results.find(r => r.url.endsWith('/favicon.ico'));
  if (defaultFavicon?.accessible) {
    const sizeInfo = defaultFavicon.size ? ` (${formatBytes(defaultFavicon.size)})` : '';
    checks.push({
      id: 'favicon-ico',
      name: 'favicon.ico exists',
      description: 'The standard /favicon.ico file is accessible',
      status: 'pass',
      details: `/favicon.ico${sizeInfo}`
    });
  } else {
    checks.push({
      id: 'favicon-ico',
      name: 'favicon.ico missing',
      description: 'The standard /favicon.ico file is not accessible',
      status: 'fail',
      details: defaultFavicon?.httpStatus
        ? `Returned HTTP ${defaultFavicon.httpStatus}`
        : 'Connection failed - file may not exist',
      recommendation: 'Add a favicon.ico file to your website root directory'
    });
  }

  const linkIcons = refs.filter(r => r.source === 'link');
  if (linkIcons.length > 0) {
    const accessibleLinks = results.filter(r =>
      r.accessible && refs.find(ref => ref.url === r.url && ref.source === 'link')
    );
    const inaccessibleLinks = linkIcons.filter(ref =>
      !results.find(r => r.url === ref.url && r.accessible)
    );

    if (accessibleLinks.length > 0) {
      const details = accessibleLinks.map(r => {
        const ref = refs.find(ref => ref.url === r.url);
        const sizeInfo = ref?.sizes ? ` [${ref.sizes}]` : '';
        return `✓ ${getShortPath(r.url)}${sizeInfo}`;
      });
      checks.push({
        id: 'link-tags',
        name: 'Link tags present',
        description: 'Favicon declared using <link> tags in HTML',
        status: 'pass',
        details: details.join('\n')
      });
    } else {
      const details = inaccessibleLinks.map(ref => `✗ ${getShortPath(ref.url)}`);
      checks.push({
        id: 'link-tags',
        name: 'Link tags inaccessible',
        description: 'Favicon link tags found but resources are not accessible',
        status: 'warning',
        details: details.join('\n'),
        recommendation: 'Check that your favicon files are properly deployed'
      });
    }
  } else {
    checks.push({
      id: 'link-tags',
      name: 'No link tags',
      description: 'No favicon link tags found in HTML',
      status: 'warning',
      details: 'No <link rel="icon"> or similar tags detected in HTML head',
      recommendation: 'Add explicit favicon link tags for better browser support'
    });
  }

  const accessibleFavicons = results.filter(r => r.accessible);
  if (accessibleFavicons.length > 0) {
    checks.push({
      id: 'any-favicon',
      name: 'Favicon available',
      description: 'At least one favicon is accessible',
      status: 'pass',
      details: `${accessibleFavicons.length} favicon(s) can be loaded by browsers`
    });
  } else {
    checks.push({
      id: 'any-favicon',
      name: 'No accessible favicon',
      description: 'No favicon could be loaded',
      status: 'fail',
      details: 'Browsers will show a generic icon or blank tab',
      recommendation: 'Ensure at least one favicon file is accessible'
    });
  }

  return {
    name: 'Basic Checks',
    score: calculateScore(checks),
    checks
  };
}

function analyzeSizeChecks(results: FaviconResult[]): CategoryResult {
  const checks: FaviconCheck[] = [];
  const accessibleFavicons = results.filter(r => r.accessible);

  const getShortPath = (url: string) => {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  };

  if (accessibleFavicons.length === 0) {
    return {
      name: 'Size & Format',
      score: 0,
      checks: [{
        id: 'no-favicons',
        name: 'No favicons to analyze',
        description: 'Cannot check sizes without accessible favicons',
        status: 'fail',
        details: 'Fix accessibility issues first to enable size analysis'
      }]
    };
  }

  const withSize = accessibleFavicons.filter(r => r.size);
  const largeFiles = withSize.filter(r => r.size && r.size > 100000);
  const okFiles = withSize.filter(r => r.size && r.size <= 100000);

  if (largeFiles.length > 0) {
    const details = largeFiles.map(f =>
      `✗ ${getShortPath(f.url)} — ${formatBytes(f.size!)} (over 100KB)`
    );
    if (okFiles.length > 0) {
      details.push(...okFiles.map(f =>
        `✓ ${getShortPath(f.url)} — ${formatBytes(f.size!)}`
      ));
    }
    checks.push({
      id: 'file-size',
      name: 'Large favicon files',
      description: 'Some favicon files are larger than recommended',
      status: 'warning',
      details: details.join('\n'),
      recommendation: 'Optimize favicon files to be under 100KB for faster loading'
    });
  } else if (withSize.length > 0) {
    const details = withSize.map(f =>
      `✓ ${getShortPath(f.url)} — ${formatBytes(f.size!)}`
    );
    checks.push({
      id: 'file-size',
      name: 'File sizes OK',
      description: 'All favicon files are reasonably sized',
      status: 'pass',
      details: details.join('\n')
    });
  }

  const formats = new Set(accessibleFavicons.map(r => r.format).filter(Boolean));
  const hasPng = formats.has('png');
  const hasIco = formats.has('ico');
  const hasSvg = formats.has('svg');

  // Group favicons by format for display
  const byFormat: Record<string, FaviconResult[]> = {};
  accessibleFavicons.forEach(r => {
    const fmt = r.format || 'unknown';
    if (!byFormat[fmt]) byFormat[fmt] = [];
    byFormat[fmt].push(r);
  });

  if (hasPng || hasSvg) {
    const details = Object.entries(byFormat).map(([fmt, files]) =>
      `${fmt.toUpperCase()}: ${files.map(f => getShortPath(f.url)).join(', ')}`
    );
    checks.push({
      id: 'modern-format',
      name: 'Modern format available',
      description: 'PNG or SVG favicon is available',
      status: 'pass',
      details: details.join('\n')
    });
  } else if (hasIco) {
    checks.push({
      id: 'modern-format',
      name: 'Only ICO format',
      description: 'Consider adding PNG favicon for better quality',
      status: 'info',
      details: 'ICO works but PNG/SVG provide better quality on high-DPI screens',
      recommendation: 'Add a PNG favicon for modern browsers'
    });
  }

  if (hasSvg) {
    const svgFiles = byFormat['svg'] || [];
    checks.push({
      id: 'svg-favicon',
      name: 'SVG favicon available',
      description: 'Vector favicon provides perfect scaling',
      status: 'pass',
      details: svgFiles.map(f => getShortPath(f.url)).join('\n')
    });
  }

  return {
    name: 'Size & Format',
    score: calculateScore(checks),
    checks
  };
}

function analyzePlatformChecks($: cheerio.CheerioAPI, refs: FaviconReference[], results: FaviconResult[]): CategoryResult {
  const checks: FaviconCheck[] = [];

  const appleTouch = refs.find(r => r.rel.includes('apple-touch-icon'));
  if (appleTouch) {
    const result = results.find(r => r.url === appleTouch.url);
    if (result?.accessible) {
      checks.push({
        id: 'apple-touch',
        name: 'Apple Touch Icon',
        description: 'Icon for iOS home screen',
        status: 'pass',
        details: appleTouch.sizes ? `Size: ${appleTouch.sizes}` : 'Found'
      });
    } else {
      checks.push({
        id: 'apple-touch',
        name: 'Apple Touch Icon inaccessible',
        description: 'Apple Touch Icon declared but not accessible',
        status: 'warning',
        recommendation: 'Ensure apple-touch-icon file is accessible'
      });
    }
  } else {
    checks.push({
      id: 'apple-touch',
      name: 'No Apple Touch Icon',
      description: 'Missing icon for iOS devices',
      status: 'warning',
      recommendation: 'Add <link rel="apple-touch-icon" href="/apple-touch-icon.png">'
    });
  }

  const msIcon = refs.find(r => r.rel === 'msapplication-TileImage');
  const msConfig = $('meta[name="msapplication-config"]').attr('content');

  if (msIcon || msConfig) {
    checks.push({
      id: 'ms-tiles',
      name: 'Microsoft Tiles',
      description: 'Windows tile icons configured',
      status: 'pass'
    });
  } else {
    checks.push({
      id: 'ms-tiles',
      name: 'No Microsoft Tiles',
      description: 'Missing Windows tile configuration',
      status: 'info',
      recommendation: 'Add msapplication meta tags for Windows tiles'
    });
  }

  const manifest = $('link[rel="manifest"]').attr('href');
  if (manifest) {
    checks.push({
      id: 'web-manifest',
      name: 'Web App Manifest',
      description: 'PWA manifest file linked',
      status: 'pass'
    });
  } else {
    checks.push({
      id: 'web-manifest',
      name: 'No Web App Manifest',
      description: 'Missing manifest.json for PWA support',
      status: 'info',
      recommendation: 'Add a web app manifest for PWA support'
    });
  }

  const themeColor = $('meta[name="theme-color"]').attr('content');
  if (themeColor) {
    checks.push({
      id: 'theme-color',
      name: 'Theme Color',
      description: 'Browser theme color set',
      status: 'pass',
      details: `Color: ${themeColor}`
    });
  }

  return {
    name: 'Platform Support',
    score: calculateScore(checks),
    checks
  };
}

function analyzeAccessibilityChecks(
  results: FaviconResult[],
  robotsResult: { accessible: boolean; blocksFavicon: boolean }
): CategoryResult {
  const checks: FaviconCheck[] = [];

  if (robotsResult.blocksFavicon) {
    checks.push({
      id: 'robots-txt',
      name: 'Blocked by robots.txt',
      description: 'robots.txt may be blocking favicon access',
      status: 'warning',
      recommendation: 'Review robots.txt to ensure favicon paths are allowed'
    });
  } else {
    checks.push({
      id: 'robots-txt',
      name: 'Not blocked by robots.txt',
      description: 'Favicon paths are not blocked',
      status: 'pass'
    });
  }

  const accessible = results.filter(r => r.accessible);
  const inaccessible = results.filter(r => !r.accessible);
  const accessibleCount = accessible.length;
  const totalCount = results.length;

  const getShortPath = (url: string) => {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  };

  if (accessibleCount === totalCount && totalCount > 0) {
    checks.push({
      id: 'all-accessible',
      name: 'All favicons accessible',
      description: 'All declared favicons can be loaded',
      status: 'pass',
      details: accessible.map(r => `✓ ${getShortPath(r.url)}`).join('\n')
    });
  } else if (accessibleCount > 0) {
    const accessibleList = accessible.map(r => `✓ ${getShortPath(r.url)}`);
    const inaccessibleList = inaccessible.map(r =>
      `✗ ${getShortPath(r.url)}${r.httpStatus ? ` (${r.httpStatus})` : ' (failed to load)'}`
    );
    checks.push({
      id: 'all-accessible',
      name: 'Some favicons inaccessible',
      description: 'Not all declared favicons can be loaded',
      status: 'warning',
      details: [...accessibleList, ...inaccessibleList].join('\n'),
      recommendation: 'Fix or remove broken favicon references'
    });
  } else {
    const inaccessibleList = inaccessible.map(r =>
      `✗ ${getShortPath(r.url)}${r.httpStatus ? ` (${r.httpStatus})` : ' (failed to load)'}`
    );
    checks.push({
      id: 'all-accessible',
      name: 'No accessible favicons',
      description: 'None of the declared favicons can be loaded',
      status: 'fail',
      details: inaccessibleList.join('\n'),
      recommendation: 'Check file paths and server configuration'
    });
  }

  const httpsOnly = results.every(r => r.url.startsWith('https://'));
  if (httpsOnly) {
    checks.push({
      id: 'https',
      name: 'HTTPS URLs',
      description: 'All favicon URLs use HTTPS',
      status: 'pass'
    });
  } else {
    const httpUrls = results.filter(r => r.url.startsWith('http://'));
    checks.push({
      id: 'https',
      name: 'Mixed HTTP/HTTPS',
      description: 'Some favicon URLs use HTTP',
      status: 'warning',
      details: httpUrls.map(r => getShortPath(r.url)).join('\n'),
      recommendation: 'Use HTTPS for all favicon URLs'
    });
  }

  return {
    name: 'Accessibility',
    score: calculateScore(checks),
    checks
  };
}
