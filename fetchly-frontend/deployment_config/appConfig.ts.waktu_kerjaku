// appConfig.ts

// Environment variable validation
const getRequiredEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    // Only throw in development, use empty string in production to avoid exposing errors
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Missing required environment variable: ${name}`);
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
  clientId: getRequiredEnvVar('NEXT_PUBLIC_GOOGLE_CLIENT_ID'),
  clientSecret: getRequiredEnvVar('GOOGLE_CLIENT_SECRET'),
};

export const dashboardConfig: DashboardConfig = {
  title: "SPLN",
  backendAPIURL: getRequiredEnvVar('NEXT_PUBLIC_BACKEND_API_URL'),
  defaultTenantCode: getRequiredEnvVar('NEXT_PUBLIC_DEFAULT_TENANT_CODE'),
  defaultProductCode: getRequiredEnvVar('NEXT_PUBLIC_DEFAULT_PRODUCT_CODE'),
  defaultObjectCode: getRequiredEnvVar('NEXT_PUBLIC_DEFAULT_OBJECT_CODE'),
  defaultViewContentCode: getRequiredEnvVar('NEXT_PUBLIC_DEFAULT_VIEW_CONTENT_CODE'),
  isDebugMode: process.env.NODE_ENV === 'development',
  googleOAuth: googleOAuthConfig,
};

export const APIMethod = {
  POST: "POST"
}