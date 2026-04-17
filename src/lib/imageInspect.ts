import sharp from 'sharp';
import type { ImageInfo } from '@/types';

// Max bytes we'll download per favicon for inspection.
// Real favicons are tiny; anything over 2MB is almost certainly not an icon.
const MAX_INSPECT_BYTES = 2 * 1024 * 1024;

export async function downloadForInspection(
  url: string,
  signal?: AbortSignal
): Promise<{ buffer: Buffer; contentType: string; cacheControl: string | null; size: number } | null> {
  try {
    const response = await fetch(url, {
      signal,
      headers: { 'User-Agent': 'FaviconLint/1.0 (+https://faviconlint.com)' },
    });
    if (!response.ok) return null;

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_INSPECT_BYTES) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_INSPECT_BYTES) return null;

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: response.headers.get('content-type') || '',
      cacheControl: response.headers.get('cache-control'),
      size: arrayBuffer.byteLength,
    };
  } catch {
    return null;
  }
}

export async function inspectImage(
  buffer: Buffer,
  url: string,
  contentType: string
): Promise<ImageInfo> {
  const lowerUrl = url.toLowerCase();
  const isIco =
    contentType.includes('ico') ||
    contentType.includes('x-icon') ||
    lowerUrl.endsWith('.ico');
  const isSvg = contentType.includes('svg') || lowerUrl.endsWith('.svg');

  if (isIco) {
    return parseIcoHeader(buffer);
  }

  if (isSvg) {
    return inspectSvg(buffer);
  }

  // PNG / JPEG / WebP / GIF → sharp handles all
  try {
    const meta = await sharp(buffer, { failOn: 'none' }).metadata();
    return {
      width: meta.width,
      height: meta.height,
      hasAlpha: meta.hasAlpha,
      actualFormat: meta.format,
    };
  } catch {
    return {};
  }
}

// ICO format spec: https://en.wikipedia.org/wiki/ICO_(file_format)
// 6-byte header + 16-byte directory entry per contained image.
function parseIcoHeader(buffer: Buffer): ImageInfo {
  if (buffer.length < 6) return {};

  const reserved = buffer.readUInt16LE(0);
  const type = buffer.readUInt16LE(2);
  const count = buffer.readUInt16LE(4);

  if (reserved !== 0 || type !== 1 || count === 0) return {};
  if (buffer.length < 6 + count * 16) return {};

  const sizes: string[] = [];
  let largestWidth = 0;
  let largestHeight = 0;

  for (let i = 0; i < count; i++) {
    const offset = 6 + i * 16;
    // 0 in width/height means 256.
    const width = buffer.readUInt8(offset) || 256;
    const height = buffer.readUInt8(offset + 1) || 256;
    sizes.push(`${width}x${height}`);
    if (width * height > largestWidth * largestHeight) {
      largestWidth = width;
      largestHeight = height;
    }
  }

  return {
    width: largestWidth,
    height: largestHeight,
    actualFormat: 'ico',
    icoSizes: sizes,
  };
}

function inspectSvg(buffer: Buffer): ImageInfo {
  const text = buffer.toString('utf8', 0, Math.min(buffer.length, 4096));
  const viewBoxMatch = text.match(/viewBox=["']([^"']+)["']/i);
  const widthMatch = text.match(/<svg[^>]*\swidth=["']([^"']+)["']/i);
  const heightMatch = text.match(/<svg[^>]*\sheight=["']([^"']+)["']/i);

  let width: number | undefined;
  let height: number | undefined;

  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/\s+/).map(Number);
    if (parts.length === 4 && !parts.some(isNaN)) {
      width = parts[2];
      height = parts[3];
    }
  }

  if (!width && widthMatch) {
    const n = parseFloat(widthMatch[1]);
    if (!isNaN(n)) width = n;
  }
  if (!height && heightMatch) {
    const n = parseFloat(heightMatch[1]);
    if (!isNaN(n)) height = n;
  }

  return {
    width,
    height,
    actualFormat: 'svg',
  };
}
