import { ReactNode } from 'react';

interface HeaderBannerProps {
  children: ReactNode;
  className?: string;
  config?: {
    backgroundGradient?: string[];
    textColor?: 'dark' | 'light';
  };
}

export function HeaderBanner({ children, className = '', config }: HeaderBannerProps) {
  return (
    <div
      className={`w-full mt-16 ${className}`}
      style={{
        background: (config?.backgroundGradient || []).length >= 2
          ? `linear-gradient(to right, ${(config?.backgroundGradient || [])[0]}, ${(config?.backgroundGradient || [])[1]})`
          : undefined
      }}
    >
      {children}
    </div>
  );
} 