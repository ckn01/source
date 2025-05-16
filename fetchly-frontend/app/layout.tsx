"use client";

import { openDB } from 'idb';
import { useParams, usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { dashboardConfig } from "./appConfig";
import DashboardLayout from "./components/DashboardLayout";
import "./globals.css";

// Define props for the root layout
interface RootLayoutProps {
  children: ReactNode;
}

interface RouteParams {
  tenantCode: string;
  productCode: string;
  objectCode: string;
  viewContentCode: string;
  [key: string]: string | string[];
}

// Define IndexedDB setup
const initDB = async () => {
  return openDB('authDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth', { keyPath: 'key' });
      }
    },
  });
};

export const getAuthValue = async (key: string, field: string) => {
  const db = await initDB();
  const result = await db.get('auth', key);

  return result?.[field] ?? null;
};

export default function RootLayout({ children }: RootLayoutProps) {
  const params = useParams<RouteParams>();
  const { tenantCode, productCode } = params;
  const [tenantData, setTenantData] = useState<any>(null);
  const pathname = usePathname();
  const noAuthRoutes = ["login", "register", "forgot-password"];
  const [isAuthRequired, setIsAuthRequired] = useState(true);

  const fetchTenantProduct = async () => {
    try {
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tenant");
      }

      const data = await response.json();
      const tenantData = data.data;

      setTenantData(tenantData);
    } catch (error) {
      console.error("Tenant API error:", error);
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const AuthToken = await getAuthValue('session', 'token');

      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/auth/current-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": AuthToken
          },
          body: JSON.stringify({}),
        }
      );

      const isNoAuthRoutes = noAuthRoutes.some((route) => pathname.includes(route));

      if (!response.ok && !isNoAuthRoutes) {
        // redirect to login
        window.location.href = `/${tenantCode}/${productCode}/login`
      }

      if (response.ok && isNoAuthRoutes) {
        window.location.href = `/${tenantCode}/${productCode}`
      }

      const data = await response.json();

    } catch (error) {
      console.error("get current user API error:", error);
    }
  }

  useEffect(() => {
    fetchTenantProduct();
  }, [])

  useEffect(() => {
    if (tenantData?.tenant_product_config?.value?.is_required_to_login && isAuthRequired) {
      fetchCurrentUser();
    }

  }, [tenantData]);

  return (
    <html lang="en">
      <body>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </body>
    </html>
  );
}