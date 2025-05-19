import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GridItemProps {
  children?: ReactNode;
  className?: string;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  style?: React.CSSProperties;
}

const getColumnClass = (size: number | undefined, breakpoint: string) => {
  if (!size) return '';
  const columnClass = `col-span-${size}`;
  return breakpoint ? `${breakpoint}:${columnClass}` : columnClass;
};

export function GridItem({
  children,
  className,
  xs = 12,
  sm,
  md,
  lg,
  xl,
  style,
}: GridItemProps) {
  console.log('GridItem props:', { xs, sm, md, lg, xl });

  const classes = cn(
    'block w-full h-full',
    getColumnClass(xs, ''),
    getColumnClass(sm, 'sm'),
    getColumnClass(md, 'md'),
    getColumnClass(lg, 'lg'),
    getColumnClass(xl, 'xl'),
    className
  );

  console.log('Generated classes:', classes);

  const combinedStyle = {
    ...style,
    gridColumn: `span ${md} / span ${xs}`,
    height: '100%',
    [`@media (min-width: 768px)`]: md ? {
      gridColumn: `span ${lg} / span ${md}`
    } : undefined
  };

  return (
    <div
      className={classes}
      style={combinedStyle}
    >
      {children}
    </div>
  );
} 