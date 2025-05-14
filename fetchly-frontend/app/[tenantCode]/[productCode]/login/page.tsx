"use client";

import { APIMethod, dashboardConfig } from "@/app/appConfig";
import { openDB } from 'idb';
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface RouteParams {
  tenantCode: string;
  productCode: string;
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

export default function LoginPage() {
  const params = useParams<RouteParams>();
  const { tenantCode, productCode } = params;
  const [tenantData, setTenantData] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const username = (e.target as any).username.value;
    const password = (e.target as any).password.value;

    try {
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        }
      );

      if (!response.ok) throw new Error('Login failed');
      const data = await response.json();

      const db = await initDB();
      await db.put('auth', { key: 'session', ...data.data });

      // redirect to dashboard
      window.location.href = `/${tenantCode}/${productCode}`;
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed!');
    }
  };

  const fetchTenantProduct = async () => {
    try {
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}`,
        {
          method: APIMethod.POST,
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

      document.title = `Login | ${tenantData?.tenant_serial__name?.display_value} | ${tenantData?.product_serial__name?.display_value}`;
    } catch (error) {
      console.error("Tenant API error:", error);
    }
  }

  useEffect(() => {
    if (tenantCode && productCode) {
      fetchTenantProduct();
    }
  }, [tenantCode, productCode]);

  return (

    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 bg-blend-overlay bg-cover bg-center relative"
      style={{
        backgroundImage: `url('/bg-login.png')`,
      }}
    >
      {/* Floating copyright */}
      <div
        style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        className="absolute bottom-4 right-4 text-white text-sm px-4 py-4 rounded-2xl backdrop-blur-sm z-50"
      >
        © {new Date().getFullYear()} <b>{tenantData?.tenant_serial__name?.display_value} - {tenantData?.product_serial__name?.display_value}</b>. All rights reserved.
      </div>

      {/* Two-column card with divider */}
      <div className="bg-white bg-opacity-90 p-12 rounded-2xl max-w-5xl w-full grid grid-cols-[1.25fr_0.05fr_1.25fr] items-center gap-4 shadow-[0_4px_0_0_rgba(0,0,0,0.4)]">
        {/* Left: Title and description */}
        <div className="px-6">
          {tenantData?.tenant_product_config?.value?.icon &&
            <Image
              src={`/${tenantData?.tenant_product_config?.value?.icon}`}
              alt="Logo"
              width={128} // adjust as needed
              height={128}
              className="w-32 mb-4"
            />
          }
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {tenantData?.tenant_serial__name?.display_value}
          </h1>
          <p className="text-base text-gray-600">
            {tenantData?.tenant_product_config?.value?.description}
          </p>
        </div>

        {/* Vertical divider */}
        <div className="hidden md:block h-[80%] w-px bg-gray-300 mx-auto"></div>

        {/* Right: Login form */}
        <div className="px-8">
          <h2 className="text-2xl text-gray-800 mb-6 text-center">Login to Your Account</h2>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username/Email/Phone Number</label>
              <input
                type="text"
                name="username"
                className="w-full border border-gray-400 rounded-2xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                className="w-full border border-gray-400 rounded-2xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-cyan-600 text-white px-4 py-4 mt-8 rounded-2xl hover:bg-cyan-800 transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
