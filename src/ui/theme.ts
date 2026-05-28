/**
 * Centralized design tokens. The original component hard-coded these hex values
 * and font stacks at dozens of call sites; collecting them here makes the dark
 * "studio" aesthetic adjustable in one place.
 */
export const theme = {
  color: {
    bg: '#0D0D0D',
    panel: '#151515',
    panelAlt: '#161616',
    border: '#222',
    borderSoft: '#1A1A1A',
    inputBg: '#1A1A1A',
    inputBorder: '#333',
    gold: '#C9A86C',
    goldBorder: '#3A3020',
    green: '#7BA092',
    greenBorder: '#2A3A30',
    heading: '#F5F0E8',
    text: '#E8E4DD',
    muted: '#888',
    faint: '#555',
    dim: '#333',
  },
  font: {
    serif: "'Instrument Serif',serif",
    mono: "'JetBrains Mono',monospace",
    sans: "'DM Sans',sans-serif",
  },
} as const;

/** Badge accent colors, keyed by the metric they annotate. */
export const badgeColors = {
  seed: '#C9A86C',
  palette: '#7BA092',
  shapes: '#A0957B',
  stroke: '#8B7BA0',
  thick: '#A07B7B',
} as const;
