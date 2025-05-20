import { toLabel } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

interface PageTitleProps {
  className?: string;
  viewContent?: {
    name: string;
    object?: {
      display_name?: string;
    };
  };
}

export function PageTitle({ className = '', viewContent }: PageTitleProps) {
  const params = useParams();
  const { viewContentCode, objectCode } = params;

  useEffect(() => {
    console.log('viewContent', viewContent);
  }, [viewContent]);

  return (
    <h1 className={`text-2xl font-bold text-cyan-600 mb-3 pt-16 ${className}`}>
      {viewContent?.object?.display_name
        ? `${viewContent.object.display_name}`
        : toLabel(objectCode as string)}
    </h1>
  );
} 