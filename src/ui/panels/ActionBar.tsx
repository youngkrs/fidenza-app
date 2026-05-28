import { useRef } from 'react';
import type { GeneratorController } from '../../hooks/useGenerator';
import { Button } from '../components/Button';
import { theme } from '../theme';

const PRINT_SIZES = [
  { label: '2K', w: 2000, h: 2500 },
  { label: '4K', w: 4000, h: 5000 },
  { label: '6×4ft', w: 10800, h: 7200 },
] as const;

/** Primary action cluster: generation, navigation, and export controls. */
export function ActionBar({ gen }: { gen: GeneratorController }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    curate,
    curating,
    randomGo,
    goBack,
    history,
    reRender,
    downloadPng,
    saveSettings,
    loadSettings,
    downloadHiRes,
    printRendering,
    exportSvg,
    exportingSvg,
  } = gen;

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}
    >
      <button
        onClick={() => void curate()}
        disabled={curating}
        style={{
          padding: '11px 16px',
          background: curating ? theme.color.inputBg : theme.color.gold,
          color: curating ? '#666' : theme.color.bg,
          border: 'none',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 500,
          cursor: curating ? 'wait' : 'pointer',
        }}
      >
        {curating ? 'Curating…' : 'Generate via Claude'}
      </button>

      <div style={{ display: 'flex', gap: 5 }}>
        <Button onClick={randomGo} color="#999">
          Random
        </Button>
        <Button
          onClick={goBack}
          disabled={history.length < 2}
          color={theme.color.gold}
          border={theme.color.goldBorder}
        >
          ← Back
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 5 }}>
        <Button onClick={reRender} color={theme.color.gold} border={theme.color.goldBorder}>
          Re-render
        </Button>
        <Button onClick={() => void downloadPng()} color={theme.color.muted}>
          PNG
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 5 }}>
        <Button onClick={saveSettings} color={theme.color.green} border={theme.color.greenBorder}>
          Save Settings
        </Button>
        <Button
          onClick={() => fileInputRef.current?.click()}
          color={theme.color.green}
          border={theme.color.greenBorder}
        >
          Load Settings
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadSettings(file);
            e.target.value = '';
          }}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{ marginTop: 2 }}>
        <div
          style={{
            fontSize: 9,
            color: theme.color.faint,
            fontFamily: theme.font.mono,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Print Download
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {PRINT_SIZES.map((s) => (
            <button
              key={s.label}
              onClick={() => void downloadHiRes(s.w, s.h)}
              disabled={printRendering}
              style={{
                flex: 1,
                padding: '7px 4px',
                background: '#1E1E1E',
                color: printRendering ? theme.color.dim : theme.color.gold,
                border: '1px solid #2A2A2A',
                borderRadius: 3,
                fontFamily: theme.font.mono,
                fontSize: 9,
                cursor: printRendering ? 'wait' : 'pointer',
              }}
            >
              {printRendering ? '…' : s.label}
            </button>
          ))}
        </div>
        {printRendering && (
          <div
            style={{
              fontSize: 9,
              color: theme.color.muted,
              fontFamily: theme.font.mono,
              marginTop: 4,
            }}
          >
            Rendering… large sizes may take a moment
          </div>
        )}
        <button
          onClick={exportSvg}
          disabled={exportingSvg}
          style={{
            width: '100%',
            marginTop: 6,
            padding: '9px',
            background: '#1E1E1E',
            color: exportingSvg ? theme.color.faint : theme.color.green,
            border: `1px solid ${theme.color.greenBorder}`,
            borderRadius: 3,
            fontFamily: theme.font.mono,
            fontSize: 10,
            cursor: exportingSvg ? 'wait' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {exportingSvg ? 'Generating SVG…' : 'Export SVG (vector — infinite scale)'}
        </button>
      </div>
    </div>
  );
}
