import { theme } from '../theme';

interface SelectProps<T extends string | number> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  /** Optional display mapper (e.g. palette index → palette name). */
  display?: (option: T, index: number) => string;
}

/**
 * Labeled dropdown. Works for both string-valued options (e.g. stroke names)
 * and numeric-valued options (e.g. palette indices); the change handler coerces
 * back to the option type based on the options' runtime type.
 */
export function Select<T extends string | number>({
  label,
  value,
  options,
  onChange,
  display,
}: SelectProps<T>) {
  const numeric = typeof options[0] === 'number';
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          fontSize: 10,
          color: theme.color.muted,
          fontFamily: theme.font.mono,
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <select
        value={value}
        onChange={(e) =>
          onChange((numeric ? Number(e.target.value) : e.target.value) as T)
        }
        style={{
          width: '100%',
          background: theme.color.inputBg,
          border: `1px solid ${theme.color.inputBorder}`,
          color: '#DDD',
          padding: '5px 7px',
          borderRadius: 3,
          fontSize: 11,
          cursor: 'pointer',
        }}
      >
        {options.map((opt, i) => (
          <option key={opt} value={opt}>
            {display ? display(opt, i) : opt}
          </option>
        ))}
      </select>
    </div>
  );
}
