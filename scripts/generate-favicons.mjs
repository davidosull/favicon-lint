#!/usr/bin/env node
// Regenerate the full favicon set from the brand gradient.
//
// Outputs into /public:
//   favicon.svg               — light-mode SVG
//   favicon-dark.svg          — dark-mode SVG
//   favicon-16x16.png         — small PNG
//   favicon-32x32.png         — small PNG
//   favicon.ico               — multi-size ICO (16 + 32 embedded as PNG)
//   apple-touch-icon.png      — 180×180, NO alpha (iOS requires opaque)
//   icon-192.png              — 192×192 PNG for PWA
//   icon-512.png              — 512×512 PNG for PWA
//   icon-maskable-512.png     — 512×512 full-bleed gradient for Android adaptive
//
// Run with: node --no-warnings scripts/generate-favicons.mjs

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '..', 'public');

// Brand palette — matches .brand-mark in globals.css
const BRAND = {
  stops: ['#9b99ff', '#6967e6', '#4b49c4'],
  brightStops: ['#c8c6ff', '#8a88f0', '#6764dc'],
  solid: '#6967e6', // flat representative color (for iOS background)
};

function makeRoundedSvg({ size = 512, bright = false } = {}) {
  const [a, b, c] = bright ? BRAND.brightStops : BRAND.stops;
  const radius = Math.round((7 / 32) * size);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="g" cx="30%" cy="20%" r="120%">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="55%" stop-color="${b}"/>
      <stop offset="100%" stop-color="${c}"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>
</svg>`;
}

function makeFullBleedSvg({ size = 512 } = {}) {
  const [a, b, c] = BRAND.stops;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="g" cx="30%" cy="20%" r="120%">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="55%" stop-color="${b}"/>
      <stop offset="100%" stop-color="${c}"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
</svg>`;
}

async function renderPng(svg, size, { flatten = false } = {}) {
  let pipeline = sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  if (flatten) {
    // Flatten transparency onto the brand solid color — for Apple Touch Icon
    pipeline = pipeline.flatten({ background: BRAND.solid });
  }
  return await pipeline.png({ compressionLevel: 9 }).toBuffer();
}

// Build an ICO from multiple PNG buffers.
// Spec: https://en.wikipedia.org/wiki/ICO_(file_format)
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);          // reserved
  header.writeUInt16LE(1, 2);          // type: ICO
  header.writeUInt16LE(pngs.length, 4);

  const directorySize = 16 * pngs.length;
  let dataOffset = 6 + directorySize;

  const entries = Buffer.alloc(directorySize);
  pngs.forEach((png, i) => {
    const off = i * 16;
    entries.writeUInt8(png.size >= 256 ? 0 : png.size, off + 0);
    entries.writeUInt8(png.size >= 256 ? 0 : png.size, off + 1);
    entries.writeUInt8(0, off + 2);            // color count
    entries.writeUInt8(0, off + 3);            // reserved
    entries.writeUInt16LE(1, off + 4);         // color planes
    entries.writeUInt16LE(32, off + 6);        // bits per pixel
    entries.writeUInt32LE(png.buffer.length, off + 8);  // size
    entries.writeUInt32LE(dataOffset, off + 12);        // offset
    dataOffset += png.buffer.length;
  });

  return Buffer.concat([header, entries, ...pngs.map((p) => p.buffer)]);
}

async function write(filename, buffer) {
  const out = path.join(PUBLIC, filename);
  await fs.writeFile(out, buffer);
  const size = buffer.length;
  console.log(`  ${filename.padEnd(28)} ${size.toString().padStart(7)} bytes`);
}

async function main() {
  console.log(`Generating favicon set → ${PUBLIC}`);

  // 1. SVG variants
  const lightSvg = makeRoundedSvg({ size: 32 });
  const darkSvg = makeRoundedSvg({ size: 32, bright: true });
  await write('favicon.svg', Buffer.from(lightSvg));
  await write('favicon-dark.svg', Buffer.from(darkSvg));

  // 2. Small PNGs (for legacy declared sizes and ICO embedding)
  const svg512 = makeRoundedSvg({ size: 512 });
  const png16 = await renderPng(svg512, 16);
  const png32 = await renderPng(svg512, 32);
  await write('favicon-16x16.png', png16);
  await write('favicon-32x32.png', png32);

  // 3. Multi-size ICO (16 + 32 embedded as PNG)
  const ico = buildIco([
    { size: 16, buffer: png16 },
    { size: 32, buffer: png32 },
  ]);
  await write('favicon.ico', ico);

  // 4. Apple Touch Icon: 180×180, flattened (NO alpha) onto brand solid
  const png180 = await renderPng(svg512, 180, { flatten: true });
  await write('apple-touch-icon.png', png180);

  // 5. PWA icons
  const png192 = await renderPng(svg512, 192);
  const png512 = await renderPng(svg512, 512);
  await write('icon-192.png', png192);
  await write('icon-512.png', png512);

  // 6. Maskable icon — full-bleed gradient, 512×512, safe-zone respected
  const maskSvg = makeFullBleedSvg({ size: 512 });
  const pngMaskable = await renderPng(maskSvg, 512);
  await write('icon-maskable-512.png', pngMaskable);

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
