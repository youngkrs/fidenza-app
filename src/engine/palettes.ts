import type { Palette, PaletteColor, RNG } from './types';

/** The 16 built-in palettes. Index is stable and persisted in saved settings. */
export const PALETTES: Palette[] = [
  { name: 'Warm Sunset', bg: '#F5F0E8', colors: [{ c: '#D94F3D', w: 0.3 }, { c: '#E8A44A', w: 0.25 }, { c: '#2B4C6F', w: 0.2 }, { c: '#F2D680', w: 0.15 }, { c: '#1A1A2E', w: 0.1 }] },
  { name: 'Ocean Depths', bg: '#F7F3ED', colors: [{ c: '#1B4965', w: 0.3 }, { c: '#5FA8D3', w: 0.25 }, { c: '#BEE9E8', w: 0.15 }, { c: '#CAE9FF', w: 0.1 }, { c: '#D94F3D', w: 0.2 }] },
  { name: 'Earth Tones', bg: '#FAF6F0', colors: [{ c: '#8B5E3C', w: 0.25 }, { c: '#D4A76A', w: 0.2 }, { c: '#2D5016', w: 0.25 }, { c: '#F4E2C1', w: 0.15 }, { c: '#3B1F0B', w: 0.15 }] },
  { name: 'Vivid Pop', bg: '#FEFAF4', colors: [{ c: '#FF3366', w: 0.25 }, { c: '#33CCCC', w: 0.2 }, { c: '#FFCC00', w: 0.2 }, { c: '#6633FF', w: 0.2 }, { c: '#111111', w: 0.15 }] },
  { name: 'Muted Pastels', bg: '#F0EDE8', colors: [{ c: '#C9B1A0', w: 0.25 }, { c: '#A3C4BC', w: 0.25 }, { c: '#E8D5B7', w: 0.2 }, { c: '#7B9E87', w: 0.15 }, { c: '#D4817A', w: 0.15 }] },
  { name: 'Midnight', bg: '#1A1A2E', colors: [{ c: '#E94560', w: 0.25 }, { c: '#0F3460', w: 0.2 }, { c: '#16213E', w: 0.15 }, { c: '#F5E6CA', w: 0.25 }, { c: '#533483', w: 0.15 }] },
  { name: 'Terracotta', bg: '#F5EDE3', colors: [{ c: '#C1440E', w: 0.3 }, { c: '#E77D5A', w: 0.2 }, { c: '#2C3E50', w: 0.2 }, { c: '#F0C27F', w: 0.15 }, { c: '#1A1A1A', w: 0.15 }] },
  { name: 'Cool Minimal', bg: '#F8F9FA', colors: [{ c: '#2D3436', w: 0.35 }, { c: '#636E72', w: 0.25 }, { c: '#B2BEC3', w: 0.15 }, { c: '#DFE6E9', w: 0.1 }, { c: '#E17055', w: 0.15 }] },
  { name: 'Golden Hour', bg: '#FDF5E6', colors: [{ c: '#D4A03E', w: 0.3 }, { c: '#C0392B', w: 0.2 }, { c: '#2C3E50', w: 0.2 }, { c: '#E8C16D', w: 0.15 }, { c: '#1B2631', w: 0.15 }] },
  { name: 'Sage & Rust', bg: '#F0EDEA', colors: [{ c: '#6B8F71', w: 0.25 }, { c: '#B85042', w: 0.25 }, { c: '#E7D8C9', w: 0.15 }, { c: '#2B3A33', w: 0.2 }, { c: '#D4A574', w: 0.15 }] },
  { name: 'Indigo Dream', bg: '#F4F1EC', colors: [{ c: '#3D405B', w: 0.3 }, { c: '#E07A5F', w: 0.25 }, { c: '#81B29A', w: 0.2 }, { c: '#F2CC8F', w: 0.15 }, { c: '#F4F1DE', w: 0.1 }] },
  { name: 'Noir', bg: '#F5F2ED', colors: [{ c: '#1A1A1A', w: 0.4 }, { c: '#333333', w: 0.25 }, { c: '#666666', w: 0.15 }, { c: '#999999', w: 0.1 }, { c: '#CC3333', w: 0.1 }] },
  { name: 'Candy', bg: '#FFF8F0', colors: [{ c: '#FF6B6B', w: 0.25 }, { c: '#4ECDC4', w: 0.25 }, { c: '#FFE66D', w: 0.2 }, { c: '#FF8B94', w: 0.15 }, { c: '#2C3E50', w: 0.15 }] },
  { name: 'Forest', bg: '#F2F0EB', colors: [{ c: '#1B4332', w: 0.3 }, { c: '#2D6A4F', w: 0.2 }, { c: '#52B788', w: 0.2 }, { c: '#D8F3DC', w: 0.15 }, { c: '#8B4513', w: 0.15 }] },
  {
    name: 'Luxe',
    bg: '#E0D7C5',
    colors: [
      { c: '#D1292F', w: 0.09 }, { c: '#DB4E53', w: 0.07 }, { c: '#E57D32', w: 0.08 }, { c: '#ED8F4B', w: 0.06 },
      { c: '#FCBC19', w: 0.07 }, { c: '#FCD164', w: 0.06 }, { c: '#29A591', w: 0.07 }, { c: '#3F8C45', w: 0.05 },
      { c: '#84CCC0', w: 0.06 }, { c: '#315E8C', w: 0.08 }, { c: '#1F3259', w: 0.06 }, { c: '#543E2E', w: 0.06 },
      { c: '#F7B0A0', w: 0.05 }, { c: '#E0AC86', w: 0.05 }, { c: '#191919', w: 0.05 }, { c: '#F9F8F4', w: 0.04 },
    ],
  },
  {
    name: 'Luxe-Derived',
    bg: '#E0D7C5',
    colors: [
      { c: '#D1292F', w: 0.2 }, { c: '#315E8C', w: 0.2 }, { c: '#FCBC19', w: 0.15 },
      { c: '#29A591', w: 0.15 }, { c: '#543E2E', w: 0.15 }, { c: '#F9F8F4', w: 0.15 },
    ],
  },
];

/**
 * Weighted choice over an option list. Walks the cumulative weight using a
 * single RNG draw; falls back to the last option to absorb floating-point
 * drift when the draw exceeds the summed weight.
 */
export function weightedChoice<T extends { w: number }>(opts: T[], rng: RNG): T {
  const r = rng();
  let s = 0;
  for (const o of opts) {
    s += o.w;
    if (r <= s) return o;
  }
  return opts[opts.length - 1];
}

/** Pick a fill color from a palette by weight. Consumes one RNG draw. */
export function pickColor(pal: Palette, rng: RNG): string {
  return weightedChoice<PaletteColor>(pal.colors, rng).c;
}

/** Palette background colors treated as "dark" → light outline/divider ink. */
const DARK_BACKGROUNDS = new Set(['#1A1A2E', '#1A1714']);

/** Outline / divider color for a palette: light ink on dark bg, else near-black. */
export function outlineColor(pal: Palette): string {
  return DARK_BACKGROUNDS.has(pal.bg) ? '#E8E4DD' : '#1A1A1A';
}
