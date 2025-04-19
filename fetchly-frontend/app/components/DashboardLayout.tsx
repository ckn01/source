"use client"; // Client component for interactivity

import { APIMethod, dashboardConfig } from "@/app/appConfig";
import * as Icons from "lucide-react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
    is_displaying_metadata_column?: Boolean;
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

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const params = useParams<RouteParams>();
  const { tenantCode, productCode, objectCode, viewContentCode } = params;
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [navigationMenuItems, setNavigationMenuItems] = useState(menuItems);
  const [navigationLayout, setNavigationLayout] = useState<any>(null);

  const toggleSidebar = () => {
    setSidebarWidth((prev) => (prev > 80 ? 56 : 256)); // Toggle between collapsed and expanded
  };

  const isSidebarOpen = sidebarWidth > 80;

  const fetchNavigation = async () => {
    try {
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${objectCode}/view/${viewContentCode}/navigation`,
        {
          method: APIMethod.POST,
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

      console.log("Navigation Data:", navigationData);

      setNavigationLayout(navigationData);
    } catch (error) {
      console.error("Layout API error:", error);
      setNavigationLayout({ error: (error as Error).message });
    }
  };

  useEffect(() => {
    if (tenantCode && productCode && objectCode && viewContentCode) {
      fetchNavigation();
    }
  }, [tenantCode, productCode, objectCode, viewContentCode]);

  const SidebarMenu = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggleExpand = (label: string) => {
      setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    return (
      <ul>
        {navigationLayout?.layout?.children.map((child: ViewChild, index: number) => {
          if (child.type === "navigation") {
            let navigationItem = child.props.fields;

            return navigationItem.map((item) => {
              const LucideIcon = Icons[item.icon] || Icons.Circle;

              return (
                <li key={item.code}>
                  {item.children.length > 0 ? (
                    <div>
                      <button
                        onClick={() => toggleExpand(item.label)}
                        className={`w-full flex items-center justify-between p-3 pl-3 hover:bg-amber-600 transition-colors text-lg text-amber-200 ${isSidebarOpen ? "text-left" : "text-center"
                          }`}
                      >
                        <span className="flex items-center gap-x-2">
                          <LucideIcon className="w-5 h-5" />
                          {isSidebarOpen ? item.title : item.title.charAt(0)}
                        </span>
                        {isSidebarOpen && (
                          <span>
                            {expanded[item.title] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </span>
                        )}
                      </button>
                      {expanded[item.label] && (
                        <ul className="pl-0">
                          {item.children.map((child: { title: string; url: string }) => (
                            <li key={child.title}>
                              <Link
                                href={`/${tenantCode}/${productCode}/${child.url}`}
                                className="flex items-center gap-x-2 p-4 pl-8 hover:bg-amber-600 transition-colors text-base text-amber-100"
                              >
                                <LucideIcon className="w-5 h-5" />
                                {isSidebarOpen ? child.title : child.title.charAt(0)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={`/${tenantCode}/${productCode}/${item.url}`}
                      className={`flex items-center gap-x-2 p-3 pl-3 hover:bg-amber-600 transition-colors text-lg text-amber-200 ${isSidebarOpen ? "text-left" : "text-center"}`}
                    >
                      <LucideIcon className="w-5 h-5" />
                      {isSidebarOpen ? item.title : item.title.charAt(0)}
                    </Link>
                  )}
                </li>
              )
            })
          }
        })}

        {/* {navigationMenuItems.map((item) => (
          <li key={item.label}>
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`w-full flex items-center justify-between p-2 pl-3 hover:bg-amber-600 transition transition-colors ${isSidebarOpen ? "text-left" : "text-center"}`}
                >
                  <span>{isSidebarOpen ? item.label : item.label.charAt(0)}</span>
                  {isSidebarOpen && (
                    <span>{expanded[item.label] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                  )}
                </button>
                {expanded[item.label] && (
                  <ul className="p-2">
                    {item.children.map((child) => (
                      <li key={child.label}>
                        <Link
                          href={child.href}
                          className="block p-2 pl-3 text-sm hover:bg-amber-600 transition-colors"
                        >
                          {isSidebarOpen ? child.label : child.label.charAt(0)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                className={`block p-2 pl-3 hover:bg-amber-600 transition-colors ${isSidebarOpen ? "text-left" : "text-center"
                  }`}
              >
                {isSidebarOpen ? item.label : item.label.charAt(0)}
              </Link>
            )}
          </li>
        ))} */}
      </ul>
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        style={{ width: sidebarWidth }}
        className="relative flex flex-col h-screen bg-gradient-to-b from-amber-900 to-amber-700 text-white shadow-lg transition-all duration-300"
      >
        {/* Header */}
        <div className="p-2 pl-3 flex items-center justify-between border-b border-amber-600">
          {isSidebarOpen && (
            <h2 className="text-2xl font-semibold tracking-wide">{dashboardConfig.title}</h2>
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
        <div className="mt-auto border-t border-amber-600 p-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
            U
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="text-sm font-medium">Username</span>
              <span className="text-xs text-amber-200 font-bold">user@email.com</span>
              <div className="text-xs text-amber-100">role permission</div>
            </div>
          )}
        </div>
      </aside >


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
      </main >
    </div>
  );
}