import type { Config } from '../engine/types';
import { renderToContext } from '../render/canvasRenderer';
import type { RenderRequest, RenderResponse } from './render.worker';

/**
 * Main-thread facade over the render Web Worker.
 *
 * Rendering a dense flow field is CPU-heavy; doing it on the main thread froze
 * the UI (the original code papered over this with requestAnimationFrame /
 * setTimeout and a "Rendering…" overlay). Here the work runs in a worker via
 * OffscreenCanvas and the result is transferred back. If workers or
 * OffscreenCanvas are unavailable, every method transparently falls back to a
 * synchronous main-thread render, so behavior degrades rather than breaks.
 */

export interface BlobResult {
  shapeCount: number;
  blob: Blob;
}

interface PendingRequest {
  resolve: (value: RenderResponse) => void;
  reject: (reason: Error) => void;
}

const supportsWorker =
  typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

let worker: Worker | null = null;
let workerUsable = supportsWorker;
let nextId = 1;
const pending = new Map<number, PendingRequest>();

function rejectAll(reason: Error): void {
  for (const p of pending.values()) p.reject(reason);
  pending.clear();
}

function getWorker(): Worker | null {
  if (!workerUsable) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./render.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (ev: MessageEvent<RenderResponse>) => {
      const res = ev.data;
      const p = pending.get(res.id);
      if (!p) return;
      pending.delete(res.id);
      if (res.ok) p.resolve(res);
      else p.reject(new Error(res.error));
    };
    worker.onerror = () => {
      workerUsable = false;
      worker = null;
      rejectAll(new Error('render worker crashed'));
    };
    return worker;
  } catch {
    workerUsable = false;
    return null;
  }
}

function request(
  kind: RenderRequest['kind'],
  seed: number,
  cfg: Config,
  w: number,
  h: number,
): Promise<RenderResponse> {
  const wk = getWorker();
  if (!wk) return Promise.reject(new Error('worker unavailable'));
  const id = nextId++;
  return new Promise<RenderResponse>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    wk.postMessage({ id, kind, seed, cfg, w, h } satisfies RenderRequest);
  });
}

function renderSync(
  canvas: HTMLCanvasElement,
  seed: number,
  cfg: Config,
  w: number,
  h: number,
): number {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  return renderToContext(ctx, seed, cfg, w, h);
}

/**
 * Render a scene into the given on-screen canvas. Returns the shape count.
 * Uses the worker when possible; otherwise renders synchronously in place.
 */
export async function renderPreview(
  canvas: HTMLCanvasElement,
  seed: number,
  cfg: Config,
  w: number,
  h: number,
): Promise<number> {
  if (getWorker()) {
    try {
      const res = await request('imagebitmap', seed, cfg, w, h);
      if (res.ok && 'bitmap' in res) {
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(res.bitmap, 0, 0);
        res.bitmap.close();
        return res.shapeCount;
      }
    } catch {
      // fall through to synchronous render
    }
  }
  return renderSync(canvas, seed, cfg, w, h);
}

/**
 * Render a scene and return it as a PNG Blob (used for downloads, including
 * very large print resolutions). Worker-backed when available.
 */
export async function renderToBlob(
  seed: number,
  cfg: Config,
  w: number,
  h: number,
): Promise<BlobResult> {
  if (getWorker()) {
    try {
      const res = await request('blob', seed, cfg, w, h);
      if (res.ok && 'blob' in res) {
        return { shapeCount: res.shapeCount, blob: res.blob };
      }
    } catch {
      // fall through to synchronous render
    }
  }
  const canvas = document.createElement('canvas');
  const shapeCount = renderSync(canvas, seed, cfg, w, h);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob produced no data'))),
      'image/png',
    );
  });
  return { shapeCount, blob };
}
