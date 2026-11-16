/**
 * Generates the SecureExam app-icon set from the brand artwork's dot matrix.
 *
 * The mark: an 11 x 11 lattice of circles, near-white at the top fading to
 * Heavy Rain at the bottom, with two empty columns forming the negative-space
 * motif. The values below are the per-dot luminance sampled from the original
 * artwork, so every size is derived from the same source.
 *
 * Run: node scripts/generate-icons.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

/* ------------------------------------------------------------------ *
 * Mark definition
 * ------------------------------------------------------------------ */

/** 11 x 11 lattice, row-major. 0 = no dot (the cut-out). */
const GRID = [
  [0, 198, 206, 224, 232, 235, 232, 224, 206, 198, 0],
  [186, 201, 224, 237, 244, 246, 244, 237, 224, 201, 186],
  [182, 212, 231, 241, 248, 250, 248, 241, 231, 212, 182],
  [189, 214, 230, 0, 246, 248, 246, 0, 230, 214, 189],
  [186, 209, 224, 0, 240, 241, 240, 0, 224, 209, 186],
  [177, 200, 215, 0, 231, 232, 231, 0, 215, 200, 177],
  [155, 186, 201, 211, 217, 219, 217, 211, 201, 186, 155],
  [132, 161, 182, 194, 199, 201, 199, 194, 182, 161, 132],
  [116, 132, 152, 169, 178, 180, 178, 169, 152, 132, 116],
  [108, 114, 127, 133, 137, 139, 137, 133, 127, 114, 108],
  [0, 102, 102, 113, 118, 120, 118, 113, 102, 102, 0],
];

const CELLS = 11;
/** Dot radius as a share of the lattice pitch. */
const DOT = 0.4;

const INK = [20, 20, 19]; // #141413
const IRONIC = [106, 106, 103]; // #6A6A67

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * @param {number} shade sampled luminance
 * @param {'dark' | 'light' | 'mono'} mode
 */
const dotColor = (shade, mode) => {
  if (mode === 'mono') return [255, 255, 255];
  if (mode === 'light') {
    // Bright dots become ink, faded dots become Iron-ic, so the mark stays
    // legible on cream instead of dissolving into it.
    const t = clamp((255 - shade) / 153, 0, 1);
    return INK.map((channel, i) => Math.round(channel + t * (IRONIC[i] - channel)));
  }
  return [shade, shade, shade];
};

/**
 * @param {{ size: number, field: number, background: string | null, mode: 'dark' | 'light' | 'mono' }} options
 */
const buildSvg = ({ size, field, background = '#141413', mode = 'dark', dot = DOT }) => {
  const pitch = field / CELLS;
  const radius = pitch * dot;
  const origin = (size - field) / 2;

  const circles = [];
  GRID.forEach((row, r) => {
    row.forEach((shade, c) => {
      if (shade === 0) return;
      const [red, green, blue] = dotColor(shade, mode);
      const cx = origin + pitch * (c + 0.5);
      const cy = origin + pitch * (r + 0.5);
      circles.push(
        `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${radius.toFixed(2)}" fill="rgb(${red},${green},${blue})" />`,
      );
    });
  });

  const bg = background ? `<rect width="${size}" height="${size}" fill="${background}" />` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg}${circles.join('')}</svg>`;
};

const writePng = async (file, svg, size) => {
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(ASSETS, file));
  console.log(`  ✓ ${file} (${size}x${size})`);
};

const main = async () => {
  await mkdir(ASSETS, { recursive: true });
  console.log('Generating SecureExam icons…');

  // Full-bleed app icon (iOS + store).
  await writePng('icon.png', buildSvg({ size: 1024, field: 730 }), 1024);

  // Android adaptive icon: mark inside the 66% safe circle, transparent layer.
  await writePng('android-icon-foreground.png', buildSvg({ size: 1024, field: 540, background: null }), 1024);
  await writePng(
    'android-icon-background.png',
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#141413"/></svg>`,
    1024,
  );
  await writePng(
    'android-icon-monochrome.png',
    buildSvg({ size: 1024, field: 540, background: null, mode: 'mono' }),
    1024,
  );

  // Web favicon + splash.
  await writePng('favicon.png', buildSvg({ size: 64, field: 48 }), 64);
  await writePng('splash-icon.png', buildSvg({ size: 1024, field: 660, background: null }), 1024);

  // Android notification small icon: white dots on transparency, 96 x 96.
  // The system tints and shrinks this to a 24dp status-bar glyph, so the dots
  // stay smaller and the field inset a little to keep the grid readable.
  await writePng(
    'notification-icon.png',
    buildSvg({ size: 96, field: 84, background: null, mode: 'mono', dot: 0.36 }),
    96,
  );

  // Full-canvas logo variants, paired with the trimmed marks below.
  await writePng('logo.png', buildSvg({ size: 512, field: 400, background: null }), 512);
  await writePng('logo-light.png', buildSvg({ size: 512, field: 400, background: null, mode: 'light' }), 512);

  // Trimmed marks for in-app chrome: at 40-48dp the padded canvas turns the
  // lattice into a smudge, so the mark is framed to its own bounds.
  await writePng('logo-mark.png', buildSvg({ size: 512, field: 486, background: null }), 512);
  await writePng(
    'logo-mark-light.png',
    buildSvg({ size: 512, field: 486, background: null, mode: 'light' }),
    512,
  );

  await writeFile(
    path.join(ASSETS, 'logo-source.svg'),
    buildSvg({ size: 512, field: 486, background: null }),
    'utf8',
  );
  console.log('  ✓ logo-source.svg');
  console.log(`Done — ${GRID.flat().filter(Boolean).length} dots per render.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
