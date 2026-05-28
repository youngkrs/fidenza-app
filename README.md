# Flow Field Generator (Fidenza-style)

16-step generative art algorithm with full parameter control.

## Example

Here's a sample composition generated with this tool (seed **223741039**):

<p align="center">
  <img src="fidenza-223741039.svg" alt="Fidenza-style flow field artwork, seed 223741039" width="400">
</p>

> If the image doesn't render above, [view the SVG directly](fidenza-223741039.svg).

## Quick Start

```bash
npm install
npm run dev
```

Then open **http://localhost:5173** in Chrome.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Type-check without emitting |
| `npm test` | Run the Vitest suite (incl. the golden-master regression) |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |

## Your Saved Settings

Load seed **223741039** with these settings for your favorite composition:

| Setting | Value |
|---------|-------|
| Seed | 223741039 |
| Palette | Luxe (index 14) |
| Thickness Center | 6px |
| Thickness Spread | 3 |
| Thickness Variation | 62% |
| Min Floor | 3px |
| Global Mult | 1.00× |
| Gap / Spacing | 1.03 |
| Density | 1.45 |
| Fill Passes | 1 |
| Curve Length | 67 |
| Segment Probability | 90% |
| Min Segments | 2 |
| Max Segments | 4 |
| End Bias | 0.88 |
| Coherence | 0.61 |
| Outline | 1.9 |
| Turbulence | 1.2 |
| Octaves | 3 |
| Persistence | 0.41 |
| Angles | Smooth |
| Spiral | None |
| Stroke | Filled |

## Features

- **Save/Load Settings** — downloads a .json file with all your slider values
- **PNG Download** — works at any size, uses Blob API for large files
- **Hi-Res Render** — 2K, 4K, or 6×4ft print resolution
- **SVG Export** — vector output that scales infinitely for large-format printing
- **Generate via Claude** — AI-curated seed selection (see setup below)

## For Printing

1. Dial in your settings at preview size (800×1000)
2. Click **Export SVG** for vector output (best for large prints)
3. Or click **4K** / **6×4ft** for raster output
4. Send the .svg file to your print shop — it scales to any size with zero pixelation

## Generate via Claude (setup)

This feature picks a seed and an evocative title/mood via the Anthropic API. The
API key is held **server-side** and never shipped to the browser:

- **Local dev:** copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. The
  Vite dev server exposes `POST /api/curate-seed` (see `vite.config.ts`).
- **Production:** deploy with the serverless function in `api/curate-seed.js`
  (Vercel/Netlify-style) and set `ANTHROPIC_API_KEY` in the host environment.

Without a key the button gracefully falls back to a random seed.

## Architecture

The app is split into clean, testable layers:

```
src/
  engine/    Pure, deterministic generative core (RNG, noise, flow field,
             geometry, palettes, computeShapes). No React, no DOM.
  render/    Unified scene walk feeding two backends: canvasRenderer + svgRenderer.
  worker/    OffscreenCanvas Web Worker + a main-thread client, so rendering
             never blocks the UI (with a synchronous fallback).
  services/  SeedCurator interface + API-backed implementation.
  state/     useReducer config state.
  hooks/     useGenerator view-model orchestrating everything.
  ui/        Themed, presentational components and panels.
```

**Determinism is guaranteed by a golden-master test:** the engine must reproduce
the committed `fidenza-223741039.svg` byte-for-byte, so the algorithm can be
refactored freely without silently changing anyone's saved art.

## Requirements

- Node.js 18+
- npm
