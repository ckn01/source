"use client";

import { dashboardConfig } from "@/app/appConfig";
import { getAuthValue } from "@/app/utils/auth";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface TimerProps {
  objectCode: string;
  viewContentCode: string;
  timerType: "countUp" | "countDown";
  startTime: string;
  endTime: string;
  className?: string;
  style?: React.CSSProperties;
}

interface TimeData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface ObjectData {
  [key: string]: {
    value: string;
    display_value: string;
  };
}

export function Timer({
  objectCode,
  viewContentCode,
  timerType,
  startTime,
  endTime,
  className,
  style
}: TimerProps) {
  const params = useParams();
  const { tenantCode, productCode } = params;
  const [timeData, setTimeData] = useState<TimeData>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [objectData, setObjectData] = useState<ObjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch object data from backend
  const fetchObjectData = async () => {
    try {
      const AuthToken = await getAuthValue('auth', 'session');
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${objectCode}/view/${viewContentCode}/data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": AuthToken
          },
          body: JSON.stringify({
            fields: {},
            filters: [],
            orders: [],
            page: 1,
            page_size: 1,
            object_code: objectCode,
            tenant_code: tenantCode,
            product_code: productCode,
            view_content_code: viewContentCode,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch object data");
      }

      const data = await response.json();
      // Get the first item from the data array
      setObjectData(data.data?.items?.[0] || {});
    } catch (error) {
      console.error("Object data API error:", error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate time difference
  const calculateTimeDifference = (start: Date, end: Date): TimeData => {
    const diffInMs = end.getTime() - start.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);

    const days = Math.floor(diffInSeconds / (24 * 60 * 60));
    const hours = Math.floor((diffInSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((diffInSeconds % (60 * 60)) / 60);
    const seconds = diffInSeconds % 60;

    return { days, hours, minutes, seconds };
  };

  // Update timer
  const updateTimer = () => {
    if (!objectData) return;

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    // Get start time
    if (startTime === "NOW()") {
      startDate = now;
    } else {
      const startValue = objectData[startTime]?.value;
      if (!startValue) return;
      startDate = new Date(startValue);
    }

    // Get end time
    if (endTime === "NOW()") {
      endDate = now;
    } else {
      const endValue = objectData[endTime]?.value;
      if (!endValue) return;
      endDate = new Date(endValue);
    }

    // Calculate time difference
    const timeDiff = calculateTimeDifference(startDate, endDate);

    // For countDown, we want to show the remaining time
    if (timerType === "countDown") {
      const totalSeconds = timeDiff.days * 24 * 60 * 60 + timeDiff.hours * 60 * 60 + timeDiff.minutes * 60 + timeDiff.seconds;
      if (totalSeconds <= 0) {
        setTimeData({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
    }

    setTimeData(timeDiff);
  };

  useEffect(() => {
    if (tenantCode && productCode && objectCode && viewContentCode) {
      fetchObjectData();
    }
  }, [tenantCode, productCode, objectCode, viewContentCode]);

  useEffect(() => {
    if (objectData) {
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [objectData, timerType, startTime, endTime]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)} style={style}>
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-red-500 p-4", className)} style={style}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-4 p-4", className)} style={style}>
      <div className="flex items-center gap-2">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{timeData.days.toString().padStart(2, '0')}</div>
          <div className="text-xs text-gray-500">Days</div>
        </div>
        <div className="text-gray-400">:</div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{timeData.hours.toString().padStart(2, '0')}</div>
          <div className="text-xs text-gray-500">Hours</div>
        </div>
        <div className="text-gray-400">:</div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{timeData.minutes.toString().padStart(2, '0')}</div>
          <div className="text-xs text-gray-500">Minutes</div>
        </div>
        <div className="text-gray-400">:</div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{timeData.seconds.toString().padStart(2, '0')}</div>
          <div className="text-xs text-gray-500">Seconds</div>
        </div>
      </div>
    </div>
  );
} 