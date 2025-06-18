// appConfig.ts

// Environment variable validation
const getRequiredEnvVar = (name: string): string => {
  // For client-side code, we only care about NEXT_PUBLIC_ variables
  const value = process.env[name];
  if (!value) {
    // For client-side env vars (NEXT_PUBLIC_), they must be available at build time
    if (name.startsWith('NEXT_PUBLIC_')) {
      console.warn(`Missing public environment variable: ${name}`);
      return ''; // Return empty string instead of throwing
    }
    // For server-side env vars, only throw in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing server environment variable: ${name}`);
    }
    return '';
  }
  return value;
};

// Configuration types
interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
}

interface DashboardConfig {
  title: string;
  backendAPIURL: string;
  defaultTenantCode: string;
  defaultProductCode: string;
  defaultObjectCode: string;
  defaultViewContentCode: string;
  isDebugMode: boolean;
  googleOAuth: GoogleOAuthConfig;
}

// Load and validate environment variables
const googleOAuthConfig: GoogleOAuthConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',  // Access directly for client-side
  clientSecret: getRequiredEnvVar('GOOGLE_CLIENT_SECRET'),   // Keep server-side only
};

export const dashboardConfig: DashboardConfig = {
  title: "SPLN",
  backendAPIURL: process.env.NEXT_PUBLIC_BACKEND_API_URL || '',  // Access directly
  defaultTenantCode: process.env.NEXT_PUBLIC_DEFAULT_TENANT_CODE || '',
  defaultProductCode: process.env.NEXT_PUBLIC_DEFAULT_PRODUCT_CODE || '',
  defaultObjectCode: process.env.NEXT_PUBLIC_DEFAULT_OBJECT_CODE || '',
  defaultViewContentCode: process.env.NEXT_PUBLIC_DEFAULT_VIEW_CONTENT_CODE || '',
  isDebugMode: process.env.NODE_ENV === 'development',
  googleOAuth: googleOAuthConfig,
};

export const APIMethod = {
  POST: "POST"
}