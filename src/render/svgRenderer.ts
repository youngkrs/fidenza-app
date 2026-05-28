import { computeShapes } from '../engine/computeShapes';
import { makeGeo } from '../engine/geometry';
import { outlineColor } from '../engine/palettes';
import type { Config, Geometry } from '../engine/types';
import { shapeToOps } from './sceneOps';

/** Serialize a ribbon to an SVG path data string (2-decimal precision). */
function geoToPath(geo: Geometry): string {
  const parts: string[] = [];
  parts.push(`M ${geo.left[0].x.toFixed(2)} ${geo.left[0].y.toFixed(2)}`);
  for (let i = 1; i < geo.left.length; i++) {
    parts.push(`L ${geo.left[i].x.toFixed(2)} ${geo.left[i].y.toFixed(2)}`);
  }
  for (let i = geo.right.length - 1; i >= 0; i--) {
    parts.push(`L ${geo.right[i].x.toFixed(2)} ${geo.right[i].y.toFixed(2)}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

/**
 * Render a scene to a standalone SVG document — vector output that scales
 * infinitely for large-format printing. Byte-for-byte stable for a given
 * (seed, Config, W, H): this is the format covered by the golden-master test.
 *
 * SVG always paints segments as filled ribbons; the canvas-only stroke
 * variants (Super Blocks, Soft Shapes, Hatched) and the film grain have no
 * vector equivalent and are intentionally absent.
 */
export function generateSVG(
  seed: number,
  cfg: Config,
  W: number,
  H: number,
): string {
  const { shapes, pal } = computeShapes(seed, cfg, W, H);
  const olColor = outlineColor(pal);
  const elements: string[] = [];

  for (const sh of shapes) {
    for (const op of shapeToOps(sh, cfg, olColor)) {
      if (op.kind === 'outline') {
        elements.push(`<path d="${geoToPath(op.geo)}" fill="${op.color}"/>`);
      } else if (op.kind === 'segment') {
        const geo = makeGeo(op.pts, op.th);
        elements.push(`<path d="${geoToPath(geo)}" fill="${op.color}"/>`);
      } else {
        elements.push(
          `<line x1="${op.x1.toFixed(2)}" y1="${op.y1.toFixed(2)}" ` +
            `x2="${op.x2.toFixed(2)}" y2="${op.y2.toFixed(2)}" ` +
            `stroke="${op.color}" stroke-width="${op.width.toFixed(2)}" ` +
            `stroke-linecap="round"/>`,
        );
      }
    }
  }

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n` +
    `<rect width="${W}" height="${H}" fill="${pal.bg}"/>\n` +
    elements.join('\n') +
    '\n</svg>'
  );
}
