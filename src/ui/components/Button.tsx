import type { CSSProperties, ReactNode } from 'react';
import { theme } from '../theme';

interface ButtonProps {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  /** Text/icon color. */
  color?: string;
  /** Border color (defaults to a neutral dim border). */
  border?: string;
  /** Stretch to fill its flex row. */
  flex?: boolean;
  style?: CSSProperties;
  title?: string;
}

/** Outlined, transparent-background action button matching the studio theme. */
export function Button({
  onClick,
  children,
  disabled = false,
  color = theme.color.muted,
  border,
  flex = true,
  style,
  title,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        flex: flex ? 1 : undefined,
        padding: '9px',
        background: 'transparent',
        color: disabled ? theme.color.dim : color,
        border: `1px solid ${disabled ? theme.color.border : border ?? theme.color.inputBorder}`,
        borderRadius: 4,
        fontFamily: theme.font.sans,
        fontSize: 11,
        cursor: disabled ? 'default' : 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
