import type { ReactNode } from 'react';
import { theme } from '../theme';

interface SectionProps {
  title: string;
  children: ReactNode;
}

/** A titled group of controls with a hairline underline. */
export function Section({ title, children }: SectionProps) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          fontFamily: theme.font.mono,
          fontSize: 9,
          color: theme.color.faint,
          textTransform: 'uppercase',
          letterSpacing: '.1em',
          marginBottom: 8,
          borderBottom: `1px solid ${theme.color.border}`,
          paddingBottom: 5,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
