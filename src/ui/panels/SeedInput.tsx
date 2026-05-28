import type { GeneratorController } from '../../hooks/useGenerator';
import { theme } from '../theme';

/** Numeric seed entry with a "Go" button (Enter also submits). */
export function SeedInput({ gen }: { gen: GeneratorController }) {
  const { seed, setSeedInput, go } = gen;

  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: 10,
          color: theme.color.muted,
          fontFamily: theme.font.mono,
          textTransform: 'uppercase',
          marginBottom: 3,
        }}
      >
        Seed
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          type="number"
          value={seed}
          onChange={(e) => setSeedInput(parseInt(e.target.value) || 1)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') go(seed);
          }}
          style={{
            flex: 1,
            background: theme.color.inputBg,
            border: `1px solid ${theme.color.inputBorder}`,
            color: theme.color.gold,
            padding: '8px 10px',
            borderRadius: 4,
            fontSize: 13,
            fontFamily: theme.font.mono,
            width: 0,
            minWidth: 0,
          }}
        />
        <button
          onClick={() => go(seed)}
          style={{
            padding: '8px 14px',
            background: '#252525',
            color: theme.color.gold,
            border: `1px solid ${theme.color.goldBorder}`,
            borderRadius: 4,
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Go
        </button>
      </div>
    </div>
  );
}
