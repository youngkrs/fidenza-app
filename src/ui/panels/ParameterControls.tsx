import {
  ANGLE_NAMES,
  PALETTES,
  SPIRAL_NAMES,
  STROKE_NAMES,
} from '../../engine';
import type { GeneratorController } from '../../hooks/useGenerator';
import { Section } from '../components/Section';
import { Select } from '../components/Select';
import { Slider } from '../components/Slider';

const pct = (v: number) => `${Math.round(v * 100)}%`;
const px = (v: number) => `${v}px`;
const fixed = (n: number) => (v: number) => v.toFixed(n);
const PALETTE_INDICES = PALETTES.map((_, i) => i);

/** All algorithm parameter sliders/selects, grouped by concern. */
export function ParameterControls({ gen }: { gen: GeneratorController }) {
  const { cfg, updateField: set } = gen;

  return (
    <>
      <Section title="Shape Controls">
        <Slider label="Gap / Spacing" value={cfg.gap} min={0} max={5} step={0.05} fmt={fixed(2)} onChange={(v) => set('gap', v)} />
        <Slider label="Density" value={cfg.density} min={0.1} max={4} step={0.05} fmt={fixed(2)} onChange={(v) => set('density', v)} />
        <Slider label="Fill Passes" value={cfg.fillPasses} min={1} max={5} step={1} onChange={(v) => set('fillPasses', v)} />
        <Slider label="Curve Length" value={cfg.curveLen} min={5} max={150} step={1} onChange={(v) => set('curveLen', v)} />
      </Section>

      <Section title="Thickness">
        <Slider label="Center (bias)" value={cfg.thickCenter} min={3} max={100} step={1} fmt={px} onChange={(v) => set('thickCenter', v)} />
        <Slider label="Spread" value={cfg.thickSpread} min={0} max={40} step={1} onChange={(v) => set('thickSpread', v)} />
        <Slider label="Variation" value={cfg.thickVariation} min={0} max={1} step={0.05} fmt={pct} onChange={(v) => set('thickVariation', v)} />
        <Slider label="Min Floor" value={cfg.thickFloor} min={1} max={20} step={1} fmt={px} onChange={(v) => set('thickFloor', v)} />
        <Slider label="Global Mult" value={cfg.thickMult} min={0.2} max={4} step={0.05} fmt={(v) => `${v.toFixed(2)}×`} onChange={(v) => set('thickMult', v)} />
      </Section>

      <Section title="Segmentation">
        <Slider label="Probability" value={cfg.segProb} min={0} max={1} step={0.01} fmt={pct} onChange={(v) => set('segProb', v)} />
        <Slider label="Min Segments" value={cfg.segMin} min={1} max={6} step={1} onChange={(v) => set('segMin', v)} />
        <Slider label="Max Segments" value={cfg.segMax} min={2} max={8} step={1} onChange={(v) => set('segMax', v)} />
        <Slider label="End Bias" value={cfg.segEndBias} min={0} max={1} step={0.05} fmt={fixed(2)} onChange={(v) => set('segEndBias', v)} />
        <Slider label="Coherence" value={cfg.segCoherence} min={0} max={1} step={0.05} fmt={fixed(2)} onChange={(v) => set('segCoherence', v)} />
        <Slider label="Outline" value={cfg.segOutline} min={0} max={4} step={0.1} fmt={fixed(1)} onChange={(v) => set('segOutline', v)} />
      </Section>

      <Section title="Flow Field">
        <Slider label="Turbulence" value={cfg.turbulence} min={0} max={5} step={0.1} fmt={fixed(1)} onChange={(v) => set('turbulence', v)} />
        <Slider label="Octaves" value={cfg.octaves} min={1} max={6} step={1} onChange={(v) => set('octaves', v)} />
        <Slider label="Persistence" value={cfg.persistence} min={0.1} max={0.8} step={0.02} fmt={fixed(2)} onChange={(v) => set('persistence', v)} />
        <Select label="Angles" value={cfg.angle} options={ANGLE_NAMES} onChange={(v) => set('angle', v)} />
        <Select label="Spiral" value={cfg.spiral} options={SPIRAL_NAMES} onChange={(v) => set('spiral', v)} />
      </Section>

      <Section title="Style">
        <Select label="Stroke" value={cfg.stroke} options={STROKE_NAMES} onChange={(v) => set('stroke', v)} />
        <Select
          label="Palette"
          value={cfg.palette}
          options={PALETTE_INDICES}
          display={(_, i) => PALETTES[i].name}
          onChange={(v) => set('palette', v)}
        />
      </Section>
    </>
  );
}
