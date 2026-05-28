import type { GeneratorController } from '../../hooks/useGenerator';
import { ActionBar } from './ActionBar';
import { CanvasSizePicker } from './CanvasSizePicker';
import { HistoryList } from './HistoryList';
import { ParameterControls } from './ParameterControls';
import { SeedInput } from './SeedInput';
import { StepsList } from './StepsList';

/** The right-hand control rail: seed, actions, parameters, and reference lists. */
export function ControlPanel({ gen }: { gen: GeneratorController }) {
  return (
    <div
      style={{
        flex: '0 0 230px',
        minWidth: 210,
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
        paddingRight: 6,
      }}
    >
      <SeedInput gen={gen} />
      <ActionBar gen={gen} />
      <ParameterControls gen={gen} />
      <CanvasSizePicker gen={gen} />
      <StepsList />
      <HistoryList gen={gen} />
    </div>
  );
}
