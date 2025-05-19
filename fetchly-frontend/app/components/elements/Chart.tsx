'use client';

import { cn } from '@/lib/utils';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';

interface ChartProps {
  className?: string;
  subType: 'bar' | 'line' | 'pie';
  props: {
    config: {
      options?: ChartOptions<any>;
    };
    dataSource: {
      data: {
        labels: string[];
        values?: number[];
        series?: Array<{
          name: string;
          data: number[];
        }>;
      };
      type: string;
    };
    title?: string;
  };
}

export function Chart({ className, subType, props }: ChartProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    ChartJS.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      BarElement,
      ArcElement,
      Title,
      Tooltip,
      Legend
    );
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className={cn('w-full h-full p-4 min-h-[300px] bg-gray-50', className)} />;
  }

  const { config, dataSource, title } = props;

  const chartData = {
    labels: dataSource.data.labels,
    datasets: dataSource.data.series
      ? dataSource.data.series.map((series) => ({
        label: series.name,
        data: series.data,
        backgroundColor: [
          'rgba(75, 192, 192, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(255, 99, 132, 0.2)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      }))
      : [{
        data: dataSource.data.values || [],
        backgroundColor: [
          'rgba(75, 192, 192, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(255, 99, 132, 0.2)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
    },
    ...config.options,
  };

  const components = {
    bar: Bar,
    line: Line,
    pie: Pie,
  };

  const ChartComponent = components[subType];

  return (
    <div className={cn('w-full h-full p-4 flex flex-col min-h-[400px]', className)}>
      <div className="flex-1 min-h-0">
        <ChartComponent data={chartData} options={options} />
      </div>
    </div>
  );
} 