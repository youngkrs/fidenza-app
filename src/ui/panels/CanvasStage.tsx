import { PALETTES } from '../../engine/palettes';
import type { GeneratorController } from '../../hooks/useGenerator';
import { Badge } from '../components/Badge';
import { badgeColors, theme } from '../theme';

/** The artwork canvas plus its metadata badges and the optional AI title card. */
export function CanvasStage({ gen }: { gen: GeneratorController }) {
  const { canvasRef, generating, seed, cfg, shapeCount, curated } = gen;

  return (
    <div style={{ flex: '1 1 420px', minWidth: 260 }}>
      <div
        style={{
          position: 'relative',
          background: theme.color.panel,
          borderRadius: 5,
          overflow: 'hidden',
          border: `1px solid ${theme.color.border}`,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        {generating && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(13,13,13,.85)',
              fontFamily: theme.font.mono,
              fontSize: 12,
              color: '#999',
            }}
          >
            Rendering…
          </div>
        )}
      </div>

      <div style={{ marginTop: 6, lineHeight: 2 }}>
        <Badge label="seed" value={seed} color={badgeColors.seed} />
        <Badge
          label="palette"
          value={PALETTES[cfg.palette].name}
          color={badgeColors.palette}
        />
        <Badge label="shapes" value={shapeCount} color={badgeColors.shapes} />
        <Badge label="stroke" value={cfg.stroke} color={badgeColors.stroke} />
        <Badge label="thick" value={`${cfg.thickCenter}px`} color={badgeColors.thick} />
      </div>

      {curated && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 14px',
            background: theme.color.panelAlt,
            borderRadius: 5,
            border: '1px solid #252525',
          }}
        >
          <div
            style={{
              fontStyle: 'italic',
              fontSize: 17,
              color: '#D4C8B0',
              fontFamily: theme.font.serif,
            }}
          >
            &ldquo;{curated.title}&rdquo;
          </div>
          <div style={{ fontSize: 10, color: '#666' }}>{curated.mood}</div>
        </div>
      )}
    </div>
  );
}
