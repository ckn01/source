"use client"; // Client component for interactivity

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { dashboardConfig } from "../appConfig";

// Props for the DashboardLayout component
interface DashboardLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "About",
    href: "/about",
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
  }
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const SidebarMenu = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggleExpand = (label: string) => {
      setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    return (
      <ul>
        {menuItems.map((item) => (
          <li key={item.label}>
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`w-full flex items-center justify-between p-2 pl-3 hover:bg-amber-600 transition-colors ${isSidebarOpen ? "text-left" : "text-center"
                    }`}
                >
                  <span>{isSidebarOpen ? item.label : item.label.charAt(0)}</span>
                  {isSidebarOpen && (
                    <span>{expanded[item.label] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                  )}
                </button>
                {expanded[item.label] && isSidebarOpen && (
                  <ul className="p-2">
                    {item.children.map((child) => (
                      <li key={child.label}>
                        <Link
                          href={child.href}
                          className="block p-2 pl-3 text-sm hover:bg-amber-600 transition-colors"
                        >
                          {child.label}
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
        ))}
      </ul>
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`flex flex-col h-screen bg-gradient-to-b from-amber-900 to-amber-700 text-white shadow-lg transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-14"}`}
      >
        {/* Header */}
        <div className="p-2 pl-3 flex items-center justify-between border-b border-amber-600">
          {isSidebarOpen && (
            <h2 className="text-2xl font-semibold tracking-wide">{dashboardConfig.title}</h2>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-amber-600 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
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
          <nav className="mt-2">
            <SidebarMenu isSidebarOpen={isSidebarOpen} />
          </nav>
        </div>

        {/* User Profile */}
        <div className="mt-auto border-t border-amber-600 p-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
            U
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="text-sm font-medium">Username</span>
              <span className="text-xs text-amber-200">user@email.com</span>
            </div>
          )}
        </div>
      </aside>


      {/* Main Content */}
      <main className="flex-1 bg-gray-50 h-screen flex flex-col overflow-auto">
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