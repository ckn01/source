"use client";

import { dashboardConfig } from "@/app/appConfig";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { LucideProps } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface MenuProps {
  viewContentCode?: string;
  overflowType?: 'overflow' | 'stacked';
}

interface NavigationItem {
  code: string;
  title: string;
  path: string;
  url: string;
  navigation_config?: {
    icon?: string;
  };
  children: NavigationItem[];
}

interface NavigationResponse {
  layout?: {
    children: any[];
  };
  error?: string;
}

export default function Menu({ viewContentCode = 'home_navigation', overflowType = 'overflow' }: MenuProps) {
  const [navigationLayout, setNavigationLayout] = useState<NavigationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const { tenantCode, productCode } = params;

  const fetchNavigation = async () => {
    try {
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/home/view/${viewContentCode}/navigation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch navigation");
      }

      const data = await response.json();
      setNavigationLayout(data.data);
    } catch (error) {
      console.error("Navigation API error:", error);
      setNavigationLayout({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantCode && productCode && viewContentCode) {
      fetchNavigation();
    }
  }, [tenantCode, productCode, viewContentCode]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (navigationLayout?.error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl">
        {navigationLayout.error}
      </div>
    );
  }

  const menuItems = navigationLayout?.layout?.children
    .filter(child => child.type === "navigation")
    .flatMap(child => child.props.fields) || [];

  const containerClasses = `
    w-full px-2 py-4 flex justify-center
  `;

  const gridClasses = `
    ${overflowType === 'overflow'
      ? 'flex overflow-x-auto hide-scrollbar gap-3'
      : `grid gap-3 ${menuItems.length <= 4
        ? `grid-cols-${menuItems.length}`
        : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      }`
    }
  `;

  return (
    <div className={containerClasses}>
      <div className={gridClasses}>
        {navigationLayout?.layout?.children.map((child: any) => {
          if (child.type === "navigation") {
            return child.props.fields.map((item: NavigationItem) => {
              const icon = (Icons[item.navigation_config?.icon as keyof typeof Icons] ?? Icons.Circle) as React.FC<LucideProps>;
              const LucideIcon = icon;

              return (
                <motion.div
                  key={item.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`
                    ${overflowType === 'overflow' ? 'flex-shrink-0' : ''}
                    w-52 h-[160px] mb-8 mt-4
                  `}
                >
                  <Link
                    href={`/${tenantCode}/${productCode}${item.url}`}
                    className="group flex flex-col items-center h-full p-4 bg-gradient-to-b from-white via-white to-gray-50/80 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    <div className="flex-1 flex items-center relative z-10">
                      <div className="p-3 bg-gray-100/80 rounded-full group-hover:bg-gray-200/90 transition-colors duration-200">
                        <LucideIcon className="w-10 h-10 text-gray-600 group-hover:text-gray-800 transition-colors duration-200" />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[64px] relative z-10">
                      <h3 className="text-base font-semibold text-gray-900 text-center mb-1 group-hover:text-gray-700 transition-colors duration-200 line-clamp-2">
                        {item.title}
                      </h3>
                      {item.children.length > 0 && (
                        <p className="text-xs text-gray-500 text-center">
                          {item.children.length} sub-items
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            });
          }
          return null;
        })}
      </div>
    </div>
  );
} 