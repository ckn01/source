"use client";

import { dashboardConfig } from "@/app/appConfig";
import { DynamicLayout } from "@/app/components/DynamicLayout";
import { getAuthValue } from "@/app/utils/auth";
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

export default function ProductPage() {
  const params = useParams<RouteParams>();
  const { tenantCode, productCode } = params;
  const [records, setRecords] = useState<RecordResponse | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-extrabold text-purple-700 mb-4">No Layout Found</h1>
        <p className="text-gray-600">The layout configuration is missing or invalid.</p>
        <pre className="mt-4 p-4 bg-gray-50 rounded text-left text-sm overflow-auto">
          {JSON.stringify(records, null, 2)}
        </pre>
      </div>
    </div>
  );
}
