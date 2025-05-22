import { CardContent, CardHeader, Card as UICard } from "@/components/ui/card";
import { ReactNode } from "react";

interface CardProps {
  title?: string;
  className?: string;
  children?: ReactNode;
}

export function Card({ title, className, children }: CardProps) {
  return (
    <UICard className={className}>
      {title && <CardHeader className="text-lg font-semibold">{title}</CardHeader>}
      <CardContent>{children}</CardContent>
    </UICard>
  );
} 