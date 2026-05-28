import type { GeneratorController } from '../../hooks/useGenerator';
import { theme } from '../theme';

const SIZES = [
  { label: '800×1000', w: 800, h: 1000 },
  { label: '1000²', w: 1000, h: 1000 },
  { label: '1200×800', w: 1200, h: 800 },
] as const;

/** Preview canvas dimension selector. */
export function CanvasSizePicker({ gen }: { gen: GeneratorController }) {
  const { size, setCanvasSize } = gen;

  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          fontFamily: theme.font.mono,
          fontSize: 9,
          color: '#444',
          textTransform: 'uppercase',
          marginBottom: 5,
        }}
      >
        Canvas
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {SIZES.map((s) => {
          const active = size.w === s.w && size.h === s.h;
          return (
            <button
              key={s.label}
              onClick={() => setCanvasSize({ w: s.w, h: s.h })}
              style={{
                padding: '3px 7px',
                background: active ? '#252525' : 'transparent',
                color: active ? theme.color.gold : theme.color.faint,
                border: '1px solid #282828',
                borderRadius: 3,
                fontFamily: theme.font.mono,
                fontSize: 9,
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
