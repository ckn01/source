import { dashboardConfig } from "@/app/appConfig";
import ActionMenuButton from "@/components/ui/ActionMenuButton";
import { useEffect, useState } from "react";

const metadataColumnList = [
  "created_at",
  "created_by",
  "deleted_at",
  "deleted_by",
  "updated_at",
  "updated_by",
  "serial",
  "id"
];

interface Field {
  field_code: string;
  field_name: string;
  field_order?: number;
}

interface RouteParams {
  tenantCode: string;
  productCode: string;
  objectCode: string;
  viewContentCode: string;
  [key: string]: string | string[];
}

interface DynamicTableProps {
  fields: Field[];
  rows?: Record<string, any>[];
  is_displaying_metadata_column?: boolean;
  currentPage?: number;
  totalPages?: number;
  loading?: boolean;
  innerWidth: number;
  actionButtonOpen: boolean[];
  setActionButtonOpen: React.Dispatch<React.SetStateAction<boolean[]>>;
  routeParams: RouteParams;
  refreshData?: () => void;
  fixHeight?: string;
  maxHeight?: string;
  onColorPaletteChange?: (colors: {
    primary: string;
    secondary: string;
    hoverPrimary: string;
    hoverSecondary: string;
    textColor: 'dark' | 'light';
  }) => void;
}

export function DynamicTable({
  fields,
  rows = [],
  is_displaying_metadata_column,
  currentPage = 1,
  totalPages = 1,
  loading,
  innerWidth,
  actionButtonOpen,
  setActionButtonOpen,
  routeParams,
  refreshData,
  fixHeight,
  maxHeight,
  onColorPaletteChange
}: DynamicTableProps) {
  const [colorPalette, setColorPalette] = useState<string[]>([]);
  const [textColor, setTextColor] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const response = await fetch(
          `${dashboardConfig.backendAPIURL}/t/${routeParams.tenantCode}/p/${routeParams.productCode}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch tenant data");
        }

        const data = await response.json();
        const tenantConfig = data.data?.tenant_product_config?.value;

        if (tenantConfig?.props?.color_palette?.length > 0) {
          setColorPalette(tenantConfig.props.color_palette);
          onColorPaletteChange?.({
            primary: tenantConfig.props.color_palette[0] || '#0891b2',
            secondary: tenantConfig.props.color_palette[1] || '#4b5563',
            hoverPrimary: tenantConfig.props.color_palette[2] || '#0e7490',
            hoverSecondary: tenantConfig.props.color_palette[3] || '#374151',
            textColor: tenantConfig.props.text_color || 'light'
          });
        }

        if (tenantConfig?.props?.text_color) {
          setTextColor(tenantConfig.props.text_color);
        }
      } catch (error) {
        console.error("Tenant API error:", error);
      }
    };

    fetchTenantData();
  }, [routeParams.tenantCode, routeParams.productCode, onColorPaletteChange]);

  return (
    <div
      className="relative overflow-x-auto"
      style={{
        minHeight: fixHeight || (rows.length > 0 ? 'auto' : 'calc(100vh - 400px)'),
        maxHeight: maxHeight || 'none',
        paddingBottom: rows.length > 0 ? '120px' : '0'
      }}
    >
      <div className="relative h-full">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-full bg-white/60 flex items-center justify-center z-10">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}

        <table className="table-auto w-full border border-gray-100 whitespace-nowrap">
          <thead>
            <tr className="bg-gray-100">
              <th
                key={"action-column"}
                className="px-2 py-2 border border-gray-100 text-left"
                style={{
                  minWidth: `48px`,
                }}
              >
              </th>

              {fields
                .filter(field => !is_displaying_metadata_column || !metadataColumnList.includes(field.field_code))
                .sort((a, b) => (a.field_order || 0) - (b.field_order || 0))
                .map((field) => {
                  if (!is_displaying_metadata_column && metadataColumnList.includes(field.field_code)) {
                    return null; // skip rendering this column
                  }

                  return (
                    <th
                      key={field.field_code}
                      className="px-2 py-4 border border-gray-100 text-left"
                      style={{
                        minWidth: `${field.field_name.length * 10 + 40}px`,
                      }}
                    >
                      {field.field_name}
                    </th>
                  )
                })}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, rowIndex) => {
                // Pre-calculate which field should be flexible
                let totalFixedWidth = 0;
                let expandableFieldCode: string | null = null;

                if (rowIndex === 0) {
                  const visibleFields = fields
                    .filter(field => !is_displaying_metadata_column || !metadataColumnList.includes(field.field_code))
                    .sort((a, b) => (a.field_order || 0) - (b.field_order || 0));

                  totalFixedWidth = visibleFields.reduce((sum, field) => {
                    return sum + (field.field_name.length * 10 + 40);
                  }, 0);

                  // If total is less than innerWidth (arbitrary threshold for ~100%), pick first visible field to flex
                  if (totalFixedWidth < innerWidth) {
                    expandableFieldCode = visibleFields[0]?.field_code ?? null;
                  }
                }

                return (
                  <tr key={rowIndex}>
                    <td
                      key={"action-item-column"}
                      className="px-2 py-2 border border-gray-100 text-gray-600"
                      style={{
                        minWidth: `48px`
                      }}
                    >
                      <ActionMenuButton
                        serial={String(row["serial"].value) || ""}
                        tenantCode={routeParams.tenantCode}
                        productCode={routeParams.productCode}
                        objectCode={routeParams.objectCode}
                        viewContentCode={routeParams.viewContentCode}
                        onDeleteSuccess={refreshData}
                      />
                    </td>

                    {fields
                      .filter(field => !is_displaying_metadata_column || !metadataColumnList.includes(field.field_code))
                      .sort((a, b) => (a.field_order || 0) - (b.field_order || 0))
                      .map((field) => {
                        if (!is_displaying_metadata_column && metadataColumnList.includes(field.field_code)) {
                          return null; // skip rendering this column
                        }

                        const rowWidth = field.field_name.length * 10 + 40;
                        const isExpandable = rowIndex === 0 && field.field_code === expandableFieldCode;

                        return (
                          <td
                            key={field.field_code}
                            className="px-2 py-4 border border-gray-100 text-gray-600"
                            style={{
                              minWidth: `${rowWidth}px`,
                              ...(isExpandable ? { width: "100%" } : {})
                            }}
                          >
                            {String(row[field.field_code]?.display_value ?? "")}
                          </td>
                        );
                      })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={fields.length}
                  className="text-center text-gray-400 py-4"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 