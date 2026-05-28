import { computeShapes } from '../engine/computeShapes';
import { makeGeo } from '../engine/geometry';
import { outlineColor, pickColor } from '../engine/palettes';
import type { Config, Geometry, Palette, Point, RNG } from '../engine/types';
import { shapeToOps } from './sceneOps';

/** A 2D context from either a DOM canvas or an OffscreenCanvas (worker). */
export type RenderingContext2D =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

/** Trace a ribbon outline onto the current path (left edge, then right reversed). */
function pathRibbon(ctx: RenderingContext2D, g: Geometry): void {
  ctx.beginPath();
  ctx.moveTo(g.left[0].x, g.left[0].y);
  for (let i = 1; i < g.left.length; i++) ctx.lineTo(g.left[i].x, g.left[i].y);
  for (let i = g.right.length - 1; i >= 0; i--) {
    ctx.lineTo(g.right[i].x, g.right[i].y);
  }
  ctx.closePath();
}

/**
 * Paint one fill segment in the active stroke style. Super Blocks, Soft Shapes,
 * and Hatched draw with the live shape RNG, so they advance the same sequence
 * the shape phase left off on — call order here is part of the determinism
 * contract for canvas (raster) output.
 */
function renderSegment(
  ctx: RenderingContext2D,
  cfg: Config,
  pal: Palette,
  rng: RNG,
  sp: Point[],
  th: number,
  color: string,
): void {
  if (sp.length < 2) return;
  const g = makeGeo(sp, th);

  if (cfg.stroke === 'Filled') {
    pathRibbon(ctx, g);
    ctx.fillStyle = color;
    ctx.fill();
  } else if (cfg.stroke === 'Outlined') {
    pathRibbon(ctx, g);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, th * 0.06);
    ctx.stroke();
  } else if (cfg.stroke === 'Super Blocks') {
    const bs = Math.max(3, th * 0.36);
    for (let i = 0; i < sp.length; i++) {
      const pt = sp[i];
      const an =
        i < sp.length - 1
          ? Math.atan2(sp[i + 1].y - pt.y, sp[i + 1].x - pt.x)
          : Math.atan2(
              pt.y - sp[Math.max(0, i - 1)].y,
              pt.x - sp[Math.max(0, i - 1)].x,
            );
      const pp = an + Math.PI / 2;
      const st = Math.ceil(th / bs);
      for (let ss = -st / 2; ss < st / 2; ss++) {
        ctx.save();
        ctx.translate(pt.x + Math.cos(pp) * ss * bs, pt.y + Math.sin(pp) * ss * bs);
        ctx.rotate(an);
        ctx.fillStyle = rng() > 0.7 ? pickColor(pal, rng) : color;
        ctx.fillRect(-bs / 2, -bs / 2, bs * 0.86, bs * 0.86);
        ctx.restore();
      }
    }
  } else if (cfg.stroke === 'Soft Shapes') {
    ctx.save();
    pathRibbon(ctx, g);
    ctx.clip();
    const cr = parseInt(color.slice(1, 3), 16);
    const cg = parseInt(color.slice(3, 5), 16);
    const cb = parseInt(color.slice(5, 7), 16);
    const nl = Math.max(8, Math.floor(th * 2));
    for (let l = 0; l < nl; l++) {
      const t = l / nl;
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.1 + rng() * 0.4})`;
      ctx.lineWidth = 0.4 + rng() * 0.5;
      ctx.beginPath();
      for (let i = 0; i < g.left.length; i++) {
        const x = g.left[i].x + (g.right[i].x - g.left[i].x) * t + (rng() - 0.5) * 2.5;
        const y = g.left[i].y + (g.right[i].y - g.left[i].y) * t + (rng() - 0.5) * 2.5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  } else if (cfg.stroke === 'Hatched') {
    ctx.save();
    pathRibbon(ctx, g);
    ctx.clip();
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.7;
    const spc = 2 + rng() * 3;
    const ha = rng() * Math.PI;
    let mnX = 1e9;
    let mxX = -1e9;
    let mnY = 1e9;
    let mxY = -1e9;
    for (const pt of [...g.left, ...g.right]) {
      mnX = Math.min(mnX, pt.x);
      mxX = Math.max(mxX, pt.x);
      mnY = Math.min(mnY, pt.y);
      mxY = Math.max(mxY, pt.y);
    }
    const dg = Math.sqrt((mxX - mnX) ** 2 + (mxY - mnY) ** 2);
    const cx = (mnX + mxX) / 2;
    const cy = (mnY + mxY) / 2;
    const cs = Math.cos(ha);
    const sn = Math.sin(ha);
    for (let dd = -dg / 2; dd < dg / 2; dd += spc) {
      ctx.beginPath();
      ctx.moveTo(cx + cs * -dg - sn * dd, cy + sn * -dg + cs * dd);
      ctx.lineTo(cx + cs * dg - sn * dd, cy + sn * dg + cs * dd);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/** Apply subtle per-pixel film grain. Skipped above ~15MP for performance. */
function applyGrain(ctx: RenderingContext2D, W: number, H: number, rng: RNG): void {
  if (W * H >= 15000000) return;
  const img = ctx.getImageData(0, 0, W, H);
  const dd = img.data;
  for (let i = 0; i < dd.length; i += 16) {
    const gr = (rng() - 0.5) * 12;
    dd[i] = Math.max(0, Math.min(255, dd[i] + gr));
    dd[i + 1] = Math.max(0, Math.min(255, dd[i + 1] + gr));
    dd[i + 2] = Math.max(0, Math.min(255, dd[i + 2] + gr));
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Compute and paint a full scene onto a 2D context. Returns the number of
 * shapes placed. Works on both a DOM canvas and an OffscreenCanvas, so the same
 * function backs the on-screen preview and the Web Worker.
 */
export function renderToContext(
  ctx: RenderingContext2D,
  seed: number,
  cfg: Config,
  W: number,
  H: number,
): number {
  const { shapes, pal, rng } = computeShapes(seed, cfg, W, H);
  const olColor = outlineColor(pal);

  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);

  for (const sh of shapes) {
    for (const op of shapeToOps(sh, cfg, olColor)) {
      if (op.kind === 'outline') {
        pathRibbon(ctx, op.geo);
        ctx.fillStyle = op.color;
        ctx.fill();
      } else if (op.kind === 'segment') {
        ctx.save();
        renderSegment(ctx, cfg, pal, rng, op.pts, op.th, op.color);
        ctx.restore();
      } else {
        ctx.strokeStyle = op.color;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(op.x1, op.y1);
        ctx.lineTo(op.x2, op.y2);
        ctx.lineWidth = op.width;
        ctx.stroke();
      }
    }
  }

  applyGrain(ctx, W, H, rng);
  return shapes.length;
}
