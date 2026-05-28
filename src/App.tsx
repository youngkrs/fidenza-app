import { useGenerator } from './hooks/useGenerator';
import { CanvasStage } from './ui/panels/CanvasStage';
import { ControlPanel } from './ui/panels/ControlPanel';
import { theme } from './ui/theme';

/**
 * Top-level composition. All behavior lives in the {@link useGenerator}
 * view-model; this component only wires the header, canvas, and control rail
 * together.
 */
export default function App() {
  const gen = useGenerator();

  return (
    <div
      style={{ minHeight: '100vh', background: theme.color.bg, color: theme.color.text }}
    >
      <div style={{ padding: '20px 24px 0', maxWidth: 1500, margin: '0 auto' }}>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 400,
            margin: 0,
            letterSpacing: '-.02em',
            color: theme.color.heading,
            fontFamily: theme.font.serif,
          }}
        >
          Flow Field Generator
        </h1>
        <p
          style={{
            fontFamily: theme.font.sans,
            fontSize: 11,
            color: theme.color.faint,
            margin: '2px 0 14px',
          }}
        >
          {gen.shapeCount} shapes · seed {gen.seed}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          maxWidth: 1500,
          margin: '0 auto',
          padding: '0 24px 40px',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <CanvasStage gen={gen} />
        <ControlPanel gen={gen} />
      </div>
    </div>
  );
}
