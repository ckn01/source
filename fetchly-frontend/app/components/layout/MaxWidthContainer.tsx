"use client";

import { ReactNode } from 'react';

interface MaxWidthContainerProps {
  children?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | number;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

const maxWidthMap = {
  sm: 'max-w-screen-sm',   // 640px
  md: 'max-w-screen-md',   // 768px
  lg: 'max-w-screen-lg',   // 1024px
  xl: 'max-w-screen-xl',   // 1280px
  '2xl': 'max-w-screen-2xl', // 1536px
  'full': 'max-w-full'     // 100%
};

export function MaxWidthContainer({
  children,
  maxWidth = 'lg',
  className = '',
  align = 'center'
}: MaxWidthContainerProps) {
  const maxWidthClass = typeof maxWidth === 'number'
    ? `max-w-[${maxWidth}px]`
    : maxWidthMap[maxWidth];

  const alignmentClass = {
    'left': 'mx-0',
    'center': 'mx-auto',
    'right': 'ml-auto'
  }[align];

  return (
    <div className={`w-full px-4 ${maxWidthClass} ${alignmentClass} ${className}`}>
      {children}
    </div>
  );
} 