import ActionMenuButton from "@/components/ui/ActionMenuButton";

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
  refreshData
}: DynamicTableProps) {
  return (
    <div className="relative overflow-x-auto" style={{ minHeight: 'calc(100vh - 400px)' }}>
      <div className="relative h-full">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-full bg-white/60 flex items-center justify-center z-10">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}

        <table className="table-auto h-full border border-gray-100 whitespace-nowrap">
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

              {fields.map((field) => {
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
                  const visibleFields = fields.filter(
                    (field) =>
                      is_displaying_metadata_column || !metadataColumnList.includes(field.field_code)
                  );

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

                    {fields.map((field) => {
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