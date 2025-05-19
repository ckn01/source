"use client";

import { dashboardConfig } from "@/app/appConfig";
import { getAuthValue } from "@/app/utils/auth";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// Define the expected params type with an index signature
interface RouteParams {
  tenantCode: string;
  productCode: string;
  [key: string]: string | string[];
}

interface RecordResponse {
  data: any;
  error?: string;
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
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/default/view/default/record`,
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
      setRecords(data);
    } catch (error) {
      console.error("Records API error:", error);
      setRecords({ data: null, error: (error as Error).message });
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-white to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        <h1 className="text-3xl font-extrabold text-purple-700 mb-4">🌟 Have a nice day!</h1>
        <p className="text-gray-600 mb-2">
          Welcome to {tenantCode} - {productCode}
        </p>
        <div className="bg-gray-50 rounded-xl p-4 shadow-inner">
          <p className="text-sm text-gray-500">Tenant Code</p>
          <p className="text-xl font-semibold text-gray-800">{tenantCode}</p>
          <p className="mt-4 text-sm text-gray-500">Product Code</p>
          <p className="text-xl font-semibold text-gray-800">{productCode}</p>
        </div>
        {records?.error ? (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl">
            {records.error}
          </div>
        ) : (
          <div className="mt-4 p-4 bg-green-50 text-green-600 rounded-xl">
            Records fetched successfully!
            <pre className="mt-2 text-left text-sm overflow-auto">
              {JSON.stringify(records?.data, null, 2)}
            </pre>
          </div>
        )}
      </motion.div>
    </div>
  );
}
