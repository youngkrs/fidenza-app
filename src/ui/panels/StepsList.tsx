import { STEPS } from '../../engine/constants';
import { theme } from '../theme';

/** Static reference list of the 16 conceptual pipeline steps. */
export function StepsList() {
  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          fontFamily: theme.font.mono,
          fontSize: 8,
          color: theme.color.dim,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        16 Steps
      </div>
      {STEPS.map((step, i) => (
        <div
          key={step}
          style={{
            display: 'flex',
            gap: 5,
            padding: '1.5px 0',
            fontSize: 9,
            color: '#3A3A3A',
          }}
        >
          <span
            style={{
              fontFamily: theme.font.mono,
              fontSize: 8,
              color: '#2A2A2A',
              width: 14,
              textAlign: 'right',
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          {step}
        </div>
      ))}
    </div>
  );
}
