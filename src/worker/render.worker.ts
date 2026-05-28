import type { Config } from '../engine/types';
import { renderToContext } from '../render/canvasRenderer';

/** Message the main thread sends to request a render. */
export interface RenderRequest {
  id: number;
  kind: 'imagebitmap' | 'blob';
  seed: number;
  cfg: Config;
  w: number;
  h: number;
}

/** Message the worker sends back. */
export type RenderResponse =
  | { id: number; ok: true; shapeCount: number; bitmap: ImageBitmap }
  | { id: number; ok: true; shapeCount: number; blob: Blob }
  | { id: number; ok: false; error: string };

/**
 * Minimal view of the dedicated-worker global, declared locally so the project
 * can compile with just the DOM lib (no WebWorker lib, which would clash with
 * `self` typed as `Window`).
 */
interface WorkerScope {
  onmessage: ((ev: MessageEvent<RenderRequest>) => void) | null;
  postMessage(message: RenderResponse, transfer?: Transferable[]): void;
}

const ws = self as unknown as WorkerScope;

ws.onmessage = async (ev) => {
  const { id, kind, seed, cfg, w, h } = ev.data;
  try {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable in worker');
    const shapeCount = renderToContext(ctx, seed, cfg, w, h);

    if (kind === 'blob') {
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      ws.postMessage({ id, ok: true, shapeCount, blob });
    } else {
      const bitmap = canvas.transferToImageBitmap();
      ws.postMessage({ id, ok: true, shapeCount, bitmap }, [bitmap]);
    }
  } catch (err) {
    ws.postMessage({ id, ok: false, error: String(err) });
  }
};
