import { ReactNode } from 'react';

interface MaxWidthContainerProps {
  children: ReactNode;
  className?: string;
  config?: {
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
    align?: 'left' | 'center' | 'right';
  };
}

export function MaxWidthContainer({ children, className = '', config }: MaxWidthContainerProps) {
  const maxWidthClass = config?.maxWidth ? `max-w-${config.maxWidth}` : '';
  const alignClass = config?.align ? `text-${config.align}` : '';

  return (
    <div className={`${maxWidthClass} ${alignClass} mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
} 