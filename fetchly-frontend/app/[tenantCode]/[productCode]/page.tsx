"use client";

import { dashboardConfig } from "@/app/appConfig";
import { DynamicLayout } from "@/app/components/DynamicLayout";
import { openDB } from 'idb';
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// Define the expected params type with an index signature
interface RouteParams {
  tenantCode: string;
  productCode: string;
  [key: string]: string | string[];
}

interface RecordResponse {
  view_content?: {
    serial: string;
    code: string;
    name: string;
    view_layout: {
      layout_config: any;
    };
    [key: string]: any;
  };
  layout?: {
    children: any[];
    class_name: string;
    props: any;
    type: string;
  };
  error?: string;
  [key: string]: any;
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

const getAuthValue = async (key: string, field: string) => {
  const db = await initDB();
  const result = await db.get('auth', key);
  return result?.[field] ?? null;
};

export default function ProductPage() {
  const params = useParams<RouteParams>();
  const { tenantCode, productCode } = params;
  const [records, setRecords] = useState<RecordResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchRecords = async () => {
    try {
      const AuthToken = await getAuthValue('auth', 'session');
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/home/view/home_default/record`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": AuthToken
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch records");
      }

      const data = await response.json();
      console.log('API Response data:', data.data); // Debug log
      console.log('API Response layout:', data.data.layout); // Debug layout specifically
      setRecords(data.data);
    } catch (error) {
      console.error("Records API error:", error);
      setRecords({
        error: (error as Error).message
      } as RecordResponse);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantCode && productCode) {
      fetchRecords();
      // Set document title
      const tenantName = records?.view_content?.tenant_name || tenantCode;
      document.title = `${productCode} - ${tenantName}`;
    }
  }, [tenantCode, productCode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-white to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (records?.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-white to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="p-4 bg-red-50 text-red-600 rounded-xl">
            {records.error}
          </div>
        </div>
      </div>
    );
  }

  return records?.layout ? (
    <DynamicLayout layout={records.layout} />
  ) : (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-white to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-purple-600">
              {currentUser?.name?.display_value?.charAt(0) || records?.view_content?.tenant_name?.charAt(0) || tenantCode.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {currentUser?.name?.display_value || 'User'}!
            </h1>
            <p className="text-gray-600">
              {records?.view_content?.tenant_name || tenantCode}
            </p>
          </div>
        </div>

        <div className="prose prose-purple max-w-none">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Application</h2>
          <div className="bg-purple-50 rounded-xl p-6 mb-6">
            <p className="text-gray-700 mb-4">
              {records?.view_content?.description || 'This is a dynamic application that allows you to manage and interact with your data efficiently. The application is designed to provide a seamless experience with its intuitive interface and powerful features.'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">Key Features</h3>
                <ul className="text-gray-600 space-y-2">
                  <li>• Dynamic data management</li>
                  <li>• Real-time updates</li>
                  <li>• Customizable views</li>
                  <li>• Secure access control</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">Getting Started</h3>
                <ul className="text-gray-600 space-y-2">
                  <li>• Navigate through the sidebar menu</li>
                  <li>• Access your data views</li>
                  <li>• Customize your preferences</li>
                  <li>• Manage your profile</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
