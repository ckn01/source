import { cn } from '@/lib/utils';
import React, { ReactNode } from 'react';

interface GridProps {
  children?: ReactNode;
  className?: string;
  container?: boolean;
  spacing?: number;
  style?: React.CSSProperties;
}

export function Grid({ children, className, container = true, spacing = 2, style }: GridProps) {
  const gapMap: { [key: number]: string } = {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
    10: 'gap-10',
    12: 'gap-12',
    16: 'gap-16',
  };

  const gapClass = gapMap[spacing] || 'gap-2';

  const combinedStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
    width: '100%',
    maxWidth: '100%',
    gridAutoRows: '1fr',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    borderRadius: '0.75rem',
    ...style,
  };

  return (
    <div
      className={cn(
        'grid grid-cols-12 w-full max-w-full grid-auto-rows-fr px-4 rounded-xl',
        gapClass,
        className
      )}
      style={combinedStyle}
    >
      {children}
    </div>
  );
} 