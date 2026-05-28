import type { Geometry, Point } from './types';

/** Interpolate between two angles along the shortest arc. */
export function lerpAngle(a1: number, a2: number, t: number): number {
  let d = a2 - a1;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a1 + d * t;
}

/**
 * Expand a centerline into a ribbon of the given thickness by offsetting each
 * point along the local normal (the bisector at interior points). Pure: depends
 * only on its inputs, so both the canvas and SVG renderers share it.
 *
 * Callers must pass at least two points.
 */
export function makeGeo(pts: Point[], th: number): Geometry {
  const hw = th / 2;
  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    let ang: number;
    if (i === 0) {
      ang = Math.atan2(pts[1].y - p.y, pts[1].x - p.x);
    } else if (i === pts.length - 1) {
      ang = Math.atan2(p.y - pts[i - 1].y, p.x - pts[i - 1].x);
    } else {
      const a1 = Math.atan2(p.y - pts[i - 1].y, p.x - pts[i - 1].x);
      const a2 = Math.atan2(pts[i + 1].y - p.y, pts[i + 1].x - p.x);
      let dd = a2 - a1;
      while (dd > Math.PI) dd -= Math.PI * 2;
      while (dd < -Math.PI) dd += Math.PI * 2;
      ang = a1 + dd * 0.5;
    }
    const pp = ang + Math.PI / 2;
    left.push({ x: p.x + Math.cos(pp) * hw, y: p.y + Math.sin(pp) * hw });
    right.push({ x: p.x - Math.cos(pp) * hw, y: p.y - Math.sin(pp) * hw });
  }
  return { left, right };
}

/**
 * Uniform-grid spatial hash used for collision/spacing between placed strokes.
 * `mark` stamps a disc as occupied; `query` tests whether a disc overlaps
 * anything already stamped. Cheap O(area/cell²) stamping with no allocation.
 */
export class SpatialHash {
  private readonly cols: number;
  private readonly rows: number;
  private readonly cellSize: number;
  private readonly occ: Uint8Array;

  constructor(width: number, height: number, cellSize: number) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize) + 2;
    this.rows = Math.ceil(height / cellSize) + 2;
    this.occ = new Uint8Array(this.cols * this.rows);
  }

  mark(x: number, y: number, radius: number): void {
    const { cellSize, cols, rows, occ } = this;
    const c1 = Math.max(0, Math.floor((x - radius) / cellSize));
    const c2 = Math.min(cols - 1, Math.floor((x + radius) / cellSize));
    const r1 = Math.max(0, Math.floor((y - radius) / cellSize));
    const r2 = Math.min(rows - 1, Math.floor((y + radius) / cellSize));
    for (let c = c1; c <= c2; c++) {
      for (let r = r1; r <= r2; r++) occ[c * rows + r] = 1;
    }
  }

  query(x: number, y: number, radius: number): boolean {
    const { cellSize, cols, rows, occ } = this;
    const c1 = Math.max(0, Math.floor((x - radius) / cellSize));
    const c2 = Math.min(cols - 1, Math.floor((x + radius) / cellSize));
    const r1 = Math.max(0, Math.floor((y - radius) / cellSize));
    const r2 = Math.min(rows - 1, Math.floor((y + radius) / cellSize));
    for (let c = c1; c <= c2; c++) {
      for (let r = r1; r <= r2; r++) {
        if (occ[c * rows + r]) return true;
      }
    }
    return false;
  }
}
