import { cn } from '@/lib/utils';
import React, { ReactNode } from 'react';

interface ContainerProps {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Container({ children, className, style }: ContainerProps) {
  // Check if any child is a Chart component
  const hasChartChild = React.Children.toArray(children).some(
    (child: any) => child?.type?.name === 'Chart'
  );

  return (
    <div
      className={cn(
        'w-full',
        hasChartChild && 'h-full',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
} 