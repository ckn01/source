import { cn } from '@/lib/utils';

interface TextProps {
  content?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Text({ content, className, style }: TextProps) {
  return (
    <p className={cn('text-base', className)} style={style}>
      {content}
    </p>
  );
} 