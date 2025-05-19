'use client';

import { dashboardConfig } from '@/app/appConfig';
import { openDB } from 'idb';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const initDB = async () => {
  return openDB('authDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth', { keyPath: 'key' });
      }
    },
  });
};

const getAuthValue = async (storeName: string, key: string) => {
  try {
    const db = await initDB();
    const value = await db.get(storeName, key);
    return value?.token;
  } catch (error) {
    console.error('Error accessing IndexedDB:', error);
    return null;
  }
};

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const path = `/${dashboardConfig.defaultTenantCode}/${dashboardConfig.defaultProductCode}`;
        const AuthToken = await getAuthValue('auth', 'session');

        if (!AuthToken) {
          router.replace(`${path}/login`);
        } else {
          router.replace(path);
        }
      } catch (error) {
        console.error('Error during auth check:', error);
        const path = `/${dashboardConfig.defaultTenantCode}/${dashboardConfig.defaultProductCode}`;
        router.replace(`${path}/login`);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  return null; // or loading indicator if you want
}
