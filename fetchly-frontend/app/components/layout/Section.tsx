import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SectionProps {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Section({ children, className, style }: SectionProps) {
  return (
    <section className={cn('w-full', className)} style={style}>
      {children}
    </section>
  );
} 