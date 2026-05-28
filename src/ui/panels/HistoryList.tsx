import type { GeneratorController } from '../../hooks/useGenerator';
import { theme } from '../theme';

const MAX_SHOWN = 10;

/** Recent seeds, click to restore. Hidden until there's history to show. */
export function HistoryList({ gen }: { gen: GeneratorController }) {
  const { history, seed, restore } = gen;
  if (history.length < 2) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          fontFamily: theme.font.mono,
          fontSize: 8,
          color: '#444',
          textTransform: 'uppercase',
          marginBottom: 5,
        }}
      >
        History
      </div>
      {history.slice(0, MAX_SHOWN).map((entry, i) => {
        const active = entry.seed === seed;
        return (
          <button
            key={`${entry.seed}-${i}`}
            onClick={() => restore(entry)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '4px 7px',
              marginBottom: 2,
              background: active ? '#1E1E1E' : 'transparent',
              border: `1px solid ${theme.color.borderSoft}`,
              borderRadius: 3,
              fontFamily: theme.font.mono,
              fontSize: 9,
              color: active ? theme.color.gold : theme.color.faint,
              cursor: 'pointer',
            }}
          >
            <span>#{entry.seed}</span>
            <span style={{ float: 'right', color: theme.color.dim }}>
              {entry.palette}
            </span>
          </button>
        );
      })}
    </div>
  );
}
