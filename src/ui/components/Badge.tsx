import { theme } from '../theme';

interface BadgeProps {
  label: string;
  value: string | number;
  color?: string;
}

/** A compact metric chip (label + value) with a tinted background. */
export function Badge({ label, value, color = theme.color.muted }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 7px',
        margin: '1px 3px 1px 0',
        borderRadius: 3,
        fontSize: 9.5,
        fontFamily: theme.font.mono,
        background: `${color}15`,
        color,
        border: `1px solid ${color}25`,
      }}
    >
      <span style={{ opacity: 0.6, marginRight: 3 }}>{label}</span>
      {value}
    </span>
  );
}
