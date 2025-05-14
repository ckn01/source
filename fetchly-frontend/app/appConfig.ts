// appConfig.ts
export const dashboardConfig = {
  title: "Fetchly",
  // backendAPIURL: "https://backend.fetchly.web.id",
  backendAPIURL: "http://localhost:8080",
  defaultTenantCode: "fetchly_delivery",
  defaultProductCode: "delivery",
  defaultObjectCode: "default",
  defaultViewContentCode: "default",
  isDebugMode: false
};

export const APIMethod = {
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH"
}