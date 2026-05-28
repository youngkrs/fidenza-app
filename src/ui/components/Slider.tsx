import { theme } from '../theme';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Optional value formatter for the readout (e.g. percent, px, ×). */
  fmt?: (v: number) => string | number;
  onChange: (value: number) => void;
}

/** Labeled range input with a live numeric readout. */
export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  fmt,
  onChange,
}: SliderProps) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 2,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: theme.color.muted,
            fontFamily: theme.font.mono,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
          }}
        >
          {label}
        </span>
        <span
          style={{ fontSize: 10, color: theme.color.gold, fontFamily: theme.font.mono }}
        >
          {fmt ? fmt(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          accentColor: theme.color.gold,
          height: 3,
          cursor: 'pointer',
        }}
      />
    </div>
  );
}
