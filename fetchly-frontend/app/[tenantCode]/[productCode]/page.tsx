"use client";

import { motion } from "framer-motion";
import { useParams } from "next/navigation";

// Define the expected params type with an index signature
interface RouteParams {
  tenantCode: string;
  productCode: string;
  [key: string]: string | string[];
}

export default function ProductPage() {
  const params = useParams<RouteParams>();
  const { tenantCode, productCode } = params;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-white to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        <h1 className="text-3xl font-extrabold text-purple-700 mb-4">🌟 Dynamic Route Page</h1>
        <p className="text-gray-600 mb-2">
          You're currently viewing:
        </p>
        <div className="bg-gray-50 rounded-xl p-4 shadow-inner">
          <p className="text-sm text-gray-500">Tenant Code</p>
          <p className="text-xl font-semibold text-gray-800">{tenantCode}</p>
          <p className="mt-4 text-sm text-gray-500">Product Code</p>
          <p className="text-xl font-semibold text-gray-800">{productCode}</p>
        </div>
      </motion.div>
    </div>
  );
}
