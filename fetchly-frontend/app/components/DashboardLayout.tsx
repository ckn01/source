"use client"; // Client component for interactivity

import { dashboardConfig } from "@/app/appConfig";
import { AnimatePresence, motion } from "framer-motion";
import { openDB } from 'idb';
import * as Icons from "lucide-react";
import { ChevronDown, ChevronLeft, ChevronRight, LucideProps } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";


// Props for the DashboardLayout component
interface DashboardLayoutProps {
  children: ReactNode;
}

interface RouteParams {
  tenantCode: string;
  productCode: string;
  objectCode: string;
  viewContentCode: string;
  [key: string]: string | string[];
}

type ViewChild = {
  type: string;
  class_name?: string;
  props: {
    fields: any[];
    is_displaying_metadata_column?: boolean;
  };
};

const menuItems = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Dynamic Page",
    children: [
      {
        label: "User",
        href: "/fetchly/delivery/user/default",
      },
      {
        label: "User Address",
        href: "/fetchly/delivery/user_address/default",
      },
    ],
  },
  {
    label: "About",
    href: "/about",
  }
];

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

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const params = useParams<RouteParams>();
  const {
    tenantCode = dashboardConfig.defaultTenantCode,
    productCode = dashboardConfig.defaultProductCode,
    objectCode = dashboardConfig.defaultObjectCode,
    viewContentCode = dashboardConfig.defaultViewContentCode,
  } = params;
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [navigationLayout, setNavigationLayout] = useState<any>(null);
  const [tenantData, setTenantData] = useState<any>(null);
  const [tenantConfig, setTenantConfig] = useState<any>(null);
  const [appTitle, setAppTitle] = useState<string>(dashboardConfig.title);
  const pathname = usePathname();
  const noSidebarRoutes = ["login", "register", "forgot-password"];
  const [currentUser, setCurrentUser] = useState<Record<string, any>>({});

  // check if pathname contains any of the noSidebarRoutes
  const isNoSidebar = noSidebarRoutes.some((route) => pathname.includes(route));

  const toggleSidebar = () => {
    setSidebarWidth((prev) => (prev > 80 ? 56 : 256)); // Toggle between collapsed and expanded
  };

  const isSidebarOpen = sidebarWidth > 80;

  const fetchTenant = async () => {
    try {
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}`,
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

      // fetching app title from tenant data
      const tenantConfig = tenantData?.tenant_config?.value
      setTenantConfig(tenantConfig);

      if (tenantConfig?.header_title) {
        setAppTitle(tenantConfig?.header_title)
      }
    } catch (error) {
      console.error("Tenant API error:", error);
    }
  }

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
        throw new Error("Failed to fetch layout");
      }

      const data = await response.json();
      const navigationData = data.data;

      setNavigationLayout(navigationData);
    } catch (error) {
      console.error("Layout API error:", error);
      setNavigationLayout({ error: (error as Error).message });
    }
  };

  const fetchCurrentUser = async () => {
    const currentUser = await getAuthValue('session', 'user');
    setCurrentUser(currentUser)
  }

  useEffect(() => {
    if (tenantCode && productCode && objectCode && viewContentCode) {
      fetchTenant();
      fetchNavigation();

      fetchCurrentUser()
    }
  }, [tenantCode, productCode, objectCode, viewContentCode]);

  useEffect(() => {
    console.log("currentUser", currentUser)
  }, [currentUser])

  const SidebarMenu = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const pathname = usePathname();

    useEffect(() => {
      if (!navigationLayout?.layout?.children) return;

      const newExpanded: Record<string, boolean> = {};

      navigationLayout.layout.children.forEach((child: ViewChild) => {
        if (child.type === "navigation") {
          child.props.fields.forEach((item) => {
            const childrenMatch = item.children?.some((child: { url: string }) => {
              const fullPath = `/${tenantCode}/${productCode}${child.url}`;
              return pathname === fullPath;
            });

            if (childrenMatch) {
              newExpanded[item.path] = true;
            }
          });
        }
      });

      setExpanded(newExpanded);
    }, [navigationLayout, pathname, tenantCode, productCode]);

    const toggleExpand = (label: string) => {
      setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    return (
      <ul>
        {navigationLayout?.layout?.children.map((child: ViewChild) => {
          if (child.type === "navigation") {
            const navigationItem = child.props.fields;

            if (!navigationItem) {
              return null;
            }

            return navigationItem.map((item) => {
              const icon = (Icons[item.navigation_config?.icon as keyof typeof Icons] ?? Icons.Circle) as React.FC<LucideProps>;
              const LucideIcon = icon;

              return (
                <li key={item.code}>
                  {item.children.length > 0 ? (
                    <div>
                      <button
                        onClick={() => toggleExpand(item.path)}
                        className={`w-full flex items-center justify-between p-3 pl-3 hover:bg-amber-600 transition-colors text-lg text-amber-200 ${isSidebarOpen ? "text-left" : "text-center"
                          }`}
                      >
                        <span className="flex items-center gap-x-1">
                          <LucideIcon className="w-6 h-6" />
                          {isSidebarOpen ? item.title : (expanded[item.path] ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                        </span>
                        {isSidebarOpen && (
                          <span>
                            {expanded[item.path] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </span>
                        )}
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded[item.path] && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 24 }}
                            className="pl-0 overflow-hidden"
                          >
                            {item.children.map((child: { title: string; url: string, navigation_config: any }) => {
                              const icon = (Icons[child?.navigation_config?.icon as keyof typeof Icons] ?? Icons.Circle) as React.FC<LucideProps>;
                              const LucideIcon = icon;

                              return (<li key={child.title}>
                                <Link
                                  href={`/${tenantCode}/${productCode}${child.url}`}
                                  className={`flex items-center gap-x-1 p-4 pl-4 transition-colors text-base ${pathname === `/${tenantCode}/${productCode}${child.url}`
                                    ? "hover:bg-amber-600 bg-amber-700 font-semibold text-white"
                                    : "hover:bg-amber-600 text-amber-100"}`}
                                >
                                  <LucideIcon className="w-6 h-6" />
                                  {isSidebarOpen && child.title}
                                </Link>
                              </li>
                              )
                            })}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href={`/${tenantCode}/${productCode}/${item.url}`}
                      className={`flex items-center gap-x-2 p-3 pl-3 hover:bg-amber-600 transition-colors text-lg text-amber-200 ${isSidebarOpen ? "text-left" : "text-center"}`}
                    >
                      <LucideIcon className="w-6 h-6" />
                      {isSidebarOpen && item.title}
                    </Link>
                  )}
                </li>
              )
            })
          }
        })}
      </ul>
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      {!isNoSidebar &&
        <aside
          style={{ width: sidebarWidth }}
          className="relative flex flex-col h-screen bg-gradient-to-b from-amber-900 to-amber-700 text-white shadow-lg transition-all duration-300"
        >
          {/* Header */}
          <div className="p-4 pl-3 flex items-center justify-between border-b border-amber-600">
            {isSidebarOpen && (
              <h2 className="text-3xl font-semibold tracking-wide">
                {appTitle}
              </h2>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-amber-600 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors  shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
            >
              {isSidebarOpen ? (
                <ChevronLeft className="w-4 h-4 text-white" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <nav className="mt-2 bg-amber-800">
              <SidebarMenu isSidebarOpen={isSidebarOpen} />
            </nav>
          </div>

          <div
            onMouseDown={(e) => {
              const startX = e.clientX;
              const startWidth = sidebarWidth;

              const onMouseMove = (e: MouseEvent) => {
                const newWidth = startWidth + (e.clientX - startX);
                if (newWidth >= 56 && newWidth <= 400) {
                  setSidebarWidth(newWidth);
                }
              };

              const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
              };

              document.addEventListener("mousemove", onMouseMove);
              document.addEventListener("mouseup", onMouseUp);
            }}
            className="absolute top-0 right-0 w-3 h-full cursor-col-resize group z-10"
          >
            {/* Visual drag indicator */}
            <div className="h-full w-full flex flex-col items-center justify-center gap-1 group-hover:gap-1.5 transition-all duration-150">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-white/40 group-hover:bg-white/70 rounded-full"></div>
              ))}
            </div>
          </div>

          {/* User Profile */}
          {tenantConfig?.is_required_to_login &&
            <div className="mt-auto border-t border-cyan-600 p-2 pb-4 pt-4 flex items-center gap-3 bg-cyan-800">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                {currentUser?.name?.display_value?.charAt(0)}
              </div>
              {isSidebarOpen &&
                <div className="flex flex-col">
                  <span className="text-md font-medium mb-1">{currentUser?.name?.display_value}</span>
                  <span className="text-xs text-amber-200 font-bold mb-1">{currentUser?.email?.display_value}</span>
                  <div className="text-xs text-amber-100 mb-1">{currentUser?.username?.display_value}</div>
                </div>
              }
            </div>
          }
        </aside >
      }


      {/* Main Content */}
      < main className="flex-1 bg-gray-50 h-screen flex flex-col overflow-auto" >
        {/* Optional fixed header inside main */}
        {/* <div className="p-4 border-b bg-gradient-to-r from-amber-900 to-amber-700 text-white shadow z-10">
          <h1 className="text-xl font-semibold">Page Title</h1>
        </div> */}

        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}