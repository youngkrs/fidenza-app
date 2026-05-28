import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { seedDefaults } from '../engine/config';
import { PALETTES } from '../engine/palettes';
import type { CanvasSize, Config } from '../engine/types';
import { generateSVG } from '../render/svgRenderer';
import { createApiSeedCurator, type CuratedSeed } from '../services/seedCurator';
import { configReducer, setField } from '../state/configReducer';
import { renderPreview, renderToBlob } from '../worker/renderClient';
import { downloadBlob, downloadText } from '../ui/download';

export interface HistoryEntry {
  seed: number;
  palette: string;
  cfg: Config;
}

const PREVIEW_SIZE: CanvasSize = { w: 800, h: 1000 };
const MAX_HISTORY = 30;

const randomSeed = () => Math.floor(Math.random() * 999999999) + 1;
const curator = createApiSeedCurator();

/**
 * View-model for the generator: owns seed/config/size/history and exposes the
 * actions the UI triggers. Rendering goes through the Web Worker client, so the
 * main thread never blocks — the `generating` flag just drives the overlay.
 */
export function useGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState(randomSeed);
  const [cfg, dispatch] = useReducer(configReducer, seed, seedDefaults);
  const [size, setSize] = useState<CanvasSize>(PREVIEW_SIZE);
  const [shapeCount, setShapeCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [curated, setCurated] = useState<CuratedSeed | null>(null);
  const [curating, setCurating] = useState(false);
  const [exportingSvg, setExportingSvg] = useState(false);
  const [printRendering, setPrintRendering] = useState(false);

  const pushHistory = useCallback((s: number, c: Config) => {
    setHistory((h) => {
      if (h.length > 0 && h[0].seed === s && h[0].cfg === c) return h;
      const entry: HistoryEntry = {
        seed: s,
        palette: PALETTES[c.palette].name,
        cfg: { ...c },
      };
      return [entry, ...h].slice(0, MAX_HISTORY);
    });
  }, []);

  const renderNow = useCallback(
    async (s: number, c: Config, sz: CanvasSize) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setGenerating(true);
      try {
        const count = await renderPreview(canvas, s, c, sz.w, sz.h);
        setShapeCount(count);
        pushHistory(s, c);
      } finally {
        setGenerating(false);
      }
    },
    [pushHistory],
  );

  /** Load a seed (and optionally a specific config) and render it. */
  const go = useCallback(
    (s: number, c?: Config) => {
      const conf = c ?? seedDefaults(s);
      setSeed(s);
      dispatch({ type: 'replace', config: conf });
      void renderNow(s, conf, size);
    },
    [renderNow, size],
  );

  const randomGo = useCallback(() => {
    setCurated(null);
    go(randomSeed());
  }, [go]);

  const reRender = useCallback(
    () => void renderNow(seed, cfg, size),
    [renderNow, seed, cfg, size],
  );

  const goBack = useCallback(() => {
    if (history.length < 2) return;
    const prev = history[1];
    setSeed(prev.seed);
    dispatch({ type: 'replace', config: prev.cfg });
    void renderNow(prev.seed, prev.cfg, size);
  }, [history, renderNow, size]);

  const restore = useCallback(
    (entry: HistoryEntry) => {
      setSeed(entry.seed);
      dispatch({ type: 'replace', config: entry.cfg });
      void renderNow(entry.seed, entry.cfg, size);
    },
    [renderNow, size],
  );

  const updateField = useCallback(
    <K extends keyof Config>(key: K, value: Config[K]) => {
      dispatch(setField(key, value));
    },
    [],
  );

  const setCanvasSize = useCallback(
    (next: CanvasSize) => {
      setSize(next);
      void renderNow(seed, cfg, next);
    },
    [renderNow, seed, cfg],
  );

  const curate = useCallback(async () => {
    setCurating(true);
    try {
      const result = await curator.curate();
      setCurated(result);
      go(result.seed);
    } catch {
      randomGo();
    } finally {
      setCurating(false);
    }
  }, [go, randomGo]);

  const setSeedInput = useCallback((value: number) => setSeed(value), []);

  // ── Exports ──────────────────────────────────────────────────────────────

  const downloadPng = useCallback(async () => {
    const { blob } = await renderToBlob(seed, cfg, size.w, size.h);
    downloadBlob(`fidenza-${seed}-${size.w}x${size.h}.png`, blob);
  }, [seed, cfg, size]);

  const downloadHiRes = useCallback(
    async (w: number, h: number) => {
      setPrintRendering(true);
      try {
        const { blob } = await renderToBlob(seed, cfg, w, h);
        downloadBlob(`fidenza-${seed}-${w}x${h}.png`, blob);
      } finally {
        setPrintRendering(false);
      }
    },
    [seed, cfg],
  );

  const exportSvg = useCallback(() => {
    setExportingSvg(true);
    // Defer so the button can flip to its busy state before the (synchronous)
    // SVG serialization runs.
    setTimeout(() => {
      try {
        const svg = generateSVG(seed, cfg, size.w, size.h);
        downloadText(`fidenza-${seed}.svg`, svg, 'image/svg+xml');
      } finally {
        setExportingSvg(false);
      }
    }, 0);
  }, [seed, cfg, size]);

  const saveSettings = useCallback(() => {
    const data = JSON.stringify({ seed, cfg, canvasSize: size }, null, 2);
    downloadText(`fidenza-${seed}-settings.json`, data, 'application/json');
  }, [seed, cfg, size]);

  const loadSettings = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(String(ev.target?.result));
          const nextSeed: number = parsed.seed ?? seed;
          const nextCfg: Config | undefined = parsed.cfg;
          const nextSize: CanvasSize = parsed.canvasSize ?? size;
          setSeed(nextSeed);
          if (nextCfg) dispatch({ type: 'replace', config: nextCfg });
          setSize(nextSize);
          if (parsed.seed && nextCfg) void renderNow(nextSeed, nextCfg, nextSize);
        } catch (err) {
          console.error('Invalid settings file', err);
        }
      };
      reader.readAsText(file);
    },
    [renderNow, seed, size],
  );

  // Render once on mount (StrictMode-safe via the ref guard).
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void renderNow(seed, cfg, size);
  }, [renderNow, seed, cfg, size]);

  return {
    canvasRef,
    seed,
    cfg,
    size,
    shapeCount,
    generating,
    history,
    curated,
    curating,
    exportingSvg,
    printRendering,
    setSeedInput,
    go,
    randomGo,
    reRender,
    goBack,
    restore,
    updateField,
    setCanvasSize,
    curate,
    downloadPng,
    downloadHiRes,
    exportSvg,
    saveSettings,
    loadSettings,
  };
}

export type GeneratorController = ReturnType<typeof useGenerator>;
