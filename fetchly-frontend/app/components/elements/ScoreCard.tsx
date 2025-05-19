import { cn } from '@/lib/utils';
import { IconType } from 'react-icons';
import { FiBriefcase, FiCheckSquare, FiDollarSign, FiUsers } from 'react-icons/fi';

interface TrendInfo {
  is_good?: boolean;
  time_span: string;
  type: 'increase' | 'decrease' | 'neutral';
  value: number;
}

interface CardConfig {
  color: string;
  icon: string;
  subtitle: string;
  title: string;
  trend: TrendInfo;
  unit?: string;
  value: string;
}

interface ScoreCardProps {
  className?: string;
  config: {
    cards: CardConfig[];
    layout: 'horizontal' | 'vertical';
    spacing: number;
    style?: React.CSSProperties;
  };
}

const iconMap: { [key: string]: IconType } = {
  dollar: FiDollarSign,
  users: FiUsers,
  tasks: FiCheckSquare,
  project: FiBriefcase,
};

export function ScoreCard({ className, config }: ScoreCardProps) {
  const { cards, layout, spacing, style } = config;

  return (
    <div
      className={cn(
        'grid gap-4',
        layout === 'horizontal' ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1',
        `gap-${spacing}`,
        className
      )}
      style={style}
    >
      {cards.map((card, index) => {
        const Icon = iconMap[card.icon.toLowerCase()] || FiDollarSign;
        const trendColor = card.trend.type === 'increase'
          ? 'text-green-500'
          : card.trend.type === 'decrease'
            ? 'text-red-500'
            : 'text-gray-500';

        return (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm"
            style={{ borderLeft: `4px solid ${card.color}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <Icon size={24} color={card.color} />
              <div className={cn('text-sm font-medium', trendColor)}>
                {card.trend.type === 'increase' && '↑'}
                {card.trend.type === 'decrease' && '↓'}
                {card.trend.value}%
                <span className="text-gray-500 ml-1">{card.trend.time_span}</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">{card.title}</h3>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold">{card.value}</span>
              {card.unit && <span className="text-gray-500 ml-1">{card.unit}</span>}
            </div>
            <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
} 