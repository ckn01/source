'use client';

import { dashboardConfig } from '@/app/appConfig';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const path = `/${dashboardConfig.defaultTenantCode}/${dashboardConfig.defaultProductCode}`;
    router.replace(path); // replace prevents back button from returning here
  }, [router]);

  return null; // or loading indicator if you want
}
