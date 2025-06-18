"use client";

import { dashboardConfig } from "@/app/appConfig";
import { openDB } from 'idb';
import { useParams, useSearchParams } from "next/navigation";
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

export default function GoogleCallbackPage() {
  const params = useParams<RouteParams>();
  const searchParams = useSearchParams();
  const { tenantCode, productCode } = params;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Get the credential from URL
        const credential = searchParams.get('credential');
        if (!credential) {
          throw new Error('No credential found in URL');
        }

        // Call backend to validate credential and get JWT token
        const response = await fetch(
          `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/auth/google-login`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to validate Google credential');
        }

        const data = await response.json();

        // Store the session data in IndexedDB
        const db = await initDB();
        await db.put('auth', { key: 'session', ...data.data });

        // Redirect to dashboard
        window.location.href = `/${tenantCode}/${productCode}`;
      } catch (err) {
        console.error('Google callback error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred during Google authentication');
      }
    };

    handleGoogleCallback();
  }, [tenantCode, productCode, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <a
            href={`/${tenantCode}/${productCode}/login`}
            className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Processing Login</h1>
        <p className="text-gray-600 mb-4">Please wait while we complete your authentication...</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
} 