import { makeGeo } from '../engine/geometry';
import type { Config, Geometry, Point, Shape } from '../engine/types';

/**
 * Backend-agnostic draw primitives. Both the canvas and SVG renderers consume
 * the same op stream, so the outline-extension, segmentation, and divider math
 * lives in exactly one place ({@link shapeToOps}) instead of being copy-pasted
 * across renderers as it was in the original monolith.
 */
export type DrawOp =
  | { kind: 'outline'; geo: Geometry; color: string }
  | { kind: 'segment'; pts: Point[]; th: number; color: string }
  | {
      kind: 'divider';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      color: string;
    };

/**
 * Flatten one shape into ordered draw ops: underlay outline (extended past
 * both ends), then each colored fill segment, then the divider ticks between
 * differently-colored segments. The order is significant — it is the exact
 * paint order both renderers rely on.
 */
export function shapeToOps(sh: Shape, cfg: Config, olColor: string): DrawOp[] {
  const ops: DrawOp[] = [];
  const { pts, th, seg } = sh;

  if (cfg.segOutline > 0) {
    const olPts = [...pts];
    const ext = cfg.segOutline * 1.5;
    if (olPts.length >= 2) {
      const p0 = olPts[0];
      const p1 = olPts[1];
      const a0 = Math.atan2(p0.y - p1.y, p0.x - p1.x);
      olPts.unshift({ x: p0.x + Math.cos(a0) * ext, y: p0.y + Math.sin(a0) * ext });
      const pL = olPts[olPts.length - 1];
      const pL2 = olPts[olPts.length - 2];
      const aL = Math.atan2(pL.y - pL2.y, pL.x - pL2.x);
      olPts.push({ x: pL.x + Math.cos(aL) * ext, y: pL.y + Math.sin(aL) * ext });
    }
    ops.push({
      kind: 'outline',
      geo: makeGeo(olPts, th + cfg.segOutline * 2),
      color: olColor,
    });
  }

  for (let i = 0; i < seg.colors.length; i++) {
    const s = seg.splits[i];
    const e = Math.min(seg.splits[i + 1] + 1, pts.length);
    const sp = pts.slice(s, e);
    if (sp.length < 2) continue;
    ops.push({ kind: 'segment', pts: sp, th, color: seg.colors[i] });
  }

  if (cfg.segOutline > 0 && seg.colors.length > 1) {
    for (let i = 1; i < seg.splits.length - 1; i++) {
      const idx = Math.min(seg.splits[i], pts.length - 1);
      if (idx <= 0 || idx >= pts.length - 1) continue;
      const pt = pts[idx];
      const next = pts[Math.min(idx + 1, pts.length - 1)];
      const prev = pts[Math.max(0, idx - 1)];
      const ang = Math.atan2(next.y - prev.y, next.x - prev.x);
      const pp = ang + Math.PI / 2;
      const hw = th / 2;
      ops.push({
        kind: 'divider',
        x1: pt.x + Math.cos(pp) * hw,
        y1: pt.y + Math.sin(pp) * hw,
        x2: pt.x - Math.cos(pp) * hw,
        y2: pt.y - Math.sin(pp) * hw,
        width: cfg.segOutline * 1.5,
        color: olColor,
      });
    }
  }

  return ops;
}
