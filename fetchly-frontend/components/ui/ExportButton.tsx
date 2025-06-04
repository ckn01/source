import { dashboardConfig } from "@/app/appConfig";
import { Download } from "lucide-react";
import { useState } from "react";

interface FilterItem {
  value: string;
  operator: string;
}

interface FilterGroup {
  operator: string;
  filter_item: Record<string, FilterItem>;
}

interface Filter {
  operator: string;
  filter_item: Record<string, FilterItem | FilterGroup>;
}

interface ExportButtonProps {
  tenantCode: string;
  productCode: string;
  objectCode: string;
  viewContentCode: string;
  filters: Filter[];
  fields: any;
  style?: React.CSSProperties;
  className?: string;
}

export default function ExportButton({
  tenantCode,
  productCode,
  objectCode,
  viewContentCode,
  filters,
  fields,
  style,
  className = ""
}: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    try {
      setIsLoading(true);

      // Transform filters to match the required structure
      const formattedFilters = filters.map(filter => ({
        operator: filter.operator,
        filter_item: Object.entries(filter.filter_item).reduce((acc, [key, value]) => {
          if ('filter_item' in value) {
            // Handle nested groups
            acc[key] = {
              operator: (value as FilterGroup).operator,
              filter_item: (value as FilterGroup).filter_item
            };
          } else {
            // Handle regular fields
            acc[key] = {
              value: (value as FilterItem).value,
              operator: (value as FilterItem).operator
            };
          }
          return acc;
        }, {} as Record<string, any>)
      }));

      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${objectCode}/view/${viewContentCode}/export`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: fields,
            filters: formattedFilters,
            orders: [],
            object_code: objectCode,
            tenant_code: tenantCode,
            product_code: productCode,
            view_content_code: viewContentCode,
            // Set a very large page size to get all records
            page: 1,
            page_size: 100000
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const data = await response.json();

      if (data.code !== 200 || !data.data?.data) {
        throw new Error("Invalid export response");
      }

      // Convert base64 to blob
      const base64Data = data.data.data.split(',')[1]; // Remove the data URL prefix
      const byteCharacters = atob(base64Data);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);

        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays, { type: data.data.content_type });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = data.data.file_name || `${objectCode}_export_${new Date().toISOString().split('T')[0]}.xls`;

      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`cursor-pointer flex items-center gap-2 m-2 px-3 py-2 rounded-lg transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none hover:brightness-110 ${className}`}
      onClick={handleExport}
      disabled={isLoading}
      style={style}
    >
      <Download size={18} />
      {isLoading ? "Exporting..." : "Export"}
    </button>
  );
} 