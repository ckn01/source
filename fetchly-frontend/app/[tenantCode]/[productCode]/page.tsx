"use client"; // Add this directive

import { useParams } from "next/navigation";

// Define the expected params type with an index signature
interface RouteParams {
  tenantCode: string;
  productCode: string;
  [key: string]: string | string[]; // Index signature for Params compatibility
}

export default function ProductPage() {
  const params = useParams<RouteParams>();
  const { tenantCode, productCode } = params;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-purple-600">Dynamic Route Page</h1>
      <div className="mt-4 text-lg text-gray-700">
        <p>Tenant Code: <strong>{tenantCode}</strong></p>
        <p>Product Code: <strong>{productCode}</strong></p>
      </div>
    </div>
  );
}