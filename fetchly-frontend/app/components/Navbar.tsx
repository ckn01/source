"use client";

import { dashboardConfig } from "@/app/appConfig";
import { AnimatePresence, motion } from "framer-motion";
import * as Icons from "lucide-react";
import { ChevronDown, LucideProps } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavbarProps {
  tenantCode?: string;
  productCode?: string;
  objectCode?: string;
  viewContentCode?: string;
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

interface TenantData {
  tenant_name?: string;
  tenant_icon?: string;
  header_title?: string;
  icon?: string;
  props?: {
    color_palette?: string[];
    text_color?: 'dark' | 'light';
  };
}

export default function Navbar({ tenantCode, productCode, objectCode, viewContentCode }: NavbarProps) {
  const [navigationLayout, setNavigationLayout] = useState<any>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const pathname = usePathname();

  const fetchTenantData = async () => {
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
        throw new Error("Failed to fetch tenant data");
      }

      const data = await response.json();
      setTenantData(data.data?.tenant_product_config?.value);
    } catch (error) {
      console.error("Tenant API error:", error);
    }
  };

  const fetchNavigation = async () => {
    try {
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${objectCode}/view/${viewContentCode}/navigation`,
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
    }
  };

  useEffect(() => {
    if (tenantCode && productCode) {
      fetchTenantData();
    }
  }, [tenantCode, productCode]);

  useEffect(() => {
    if (tenantCode && productCode) {
      fetchNavigation();
    }
  }, [tenantCode, productCode, objectCode, viewContentCode]);

  const toggleExpand = (path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const textColor = tenantData?.props?.text_color === 'dark' ? 'text-gray-900' : 'text-white';
  const hoverTextColor = tenantData?.props?.text_color === 'dark' ? 'hover:text-gray-600' : 'hover:text-gray-200';
  const activeTextColor = tenantData?.props?.text_color === 'dark' ? 'text-gray-900' : 'text-white';
  const borderColor = tenantData?.props?.text_color === 'dark' ? 'border-gray-900' : 'border-white';
  const hoverBorderColor = tenantData?.props?.text_color === 'dark' ? 'hover:border-gray-300' : 'hover:border-gray-200';
  const hoverBgColor = tenantData?.props?.text_color === 'dark' ? 'hover:bg-gray-100' : 'hover:bg-white/10';

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 shadow-md"
      style={{
        background: tenantData?.props?.color_palette && tenantData.props.color_palette.length >= 2
          ? `linear-gradient(to right, ${tenantData.props.color_palette[0]}, ${tenantData.props.color_palette[1]})`
          : tenantData?.props?.color_palette?.[0] || '#434343'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20">
          <div className="flex items-center gap-3 mr-12">
            {tenantData?.icon && (
              <Image
                src={`/${tenantData.icon}`}
                alt="Tenant Icon"
                width={40}
                height={40}
                className="object-contain"
              />
            )}
            <Link
              href={`/${tenantCode}/${productCode}`}
              className={`text-2xl font-bold ${textColor}`}
            >
              {tenantData?.header_title || dashboardConfig.title}
            </Link>
          </div>
          <div className="hidden sm:flex sm:items-center sm:space-x-6">
            {navigationLayout?.layout?.children.map((child: any) => {
              if (child.type === "navigation") {
                return child.props.fields.map((item: NavigationItem) => {
                  const icon = (Icons[item.navigation_config?.icon as keyof typeof Icons] ?? Icons.Circle) as React.FC<LucideProps>;
                  const LucideIcon = icon;

                  return (
                    <div key={item.code} className="relative">
                      {item.children.length > 0 ? (
                        <div>
                          <button
                            onClick={() => toggleExpand(item.path)}
                            className={`group inline-flex items-center px-4 py-2 text-base font-medium rounded-2xl transition-all duration-200 ${textColor} ${hoverTextColor} ${hoverBgColor}`}
                          >
                            <LucideIcon className={`w-5 h-5 mr-2 ${textColor} transition-transform duration-200 group-hover:scale-110`} />
                            <span className="transition-transform duration-200 group-hover:scale-105 origin-left">{item.title}</span>
                            <ChevronDown className={`ml-2 w-4 h-4 transition-all duration-200 group-hover:scale-110 ${expanded[item.path] ? 'rotate-180' : ''} ${textColor}`} />
                          </button>
                          <AnimatePresence>
                            {expanded[item.path] && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                              >
                                <div className="py-1">
                                  {item.children.map((child: NavigationItem) => {
                                    const childIcon = (Icons[child.navigation_config?.icon as keyof typeof Icons] ?? Icons.Circle) as React.FC<LucideProps>;
                                    const ChildIcon = childIcon;

                                    return (
                                      <Link
                                        key={child.code}
                                        href={`/${tenantCode}/${productCode}${child.url}`}
                                        className={`group flex items-center px-4 py-2 text-base text-gray-700 hover:bg-gray-100 first:rounded-t-xl last:rounded-b-xl ${pathname === `/${tenantCode}/${productCode}${child.url}` ? 'bg-gray-50' : ''}`}
                                      >
                                        <ChildIcon className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110" />
                                        <span className="transition-transform duration-200 group-hover:scale-105 origin-left">{child.title}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <Link
                          href={`/${tenantCode}/${productCode}${item.url}`}
                          className={`group inline-flex items-center px-4 py-2 text-base font-medium rounded-2xl transition-all duration-200 ${pathname === `/${tenantCode}/${productCode}${item.url}`
                            ? `${activeTextColor} ${hoverBgColor} bg-white/5`
                            : `${textColor} ${hoverTextColor} ${hoverBgColor}`
                            }`}
                        >
                          <LucideIcon className={`w-5 h-5 mr-2 ${textColor} transition-transform duration-200 group-hover:scale-110`} />
                          <span className="transition-transform duration-200 group-hover:scale-105 origin-left">{item.title}</span>
                        </Link>
                      )}
                    </div>
                  );
                });
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </nav>
  );
} 