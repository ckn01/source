"use client";

import { APIMethod, dashboardConfig } from "@/app/appConfig";
import SidebarPanel from "@/components/SidebarPanel";
import ActionMenuButton from "@/components/ui/ActionMenuButton";
import { Card, CardContent } from "@/components/ui/card";
import { toLabel } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle, Filter, PlusCircle, RefreshCcw, TrashIcon, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ReactPaginate from 'react-paginate';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const metadataColumnList = [
  "created_at",
  "created_by",
  "deleted_at",
  "deleted_by",
  "updated_at",
  "updated_by",
  "serial",
  "id"
]

interface RouteParams {
  tenantCode: string;
  productCode: string;
  objectCode: string;
  viewContentCode: string;
  [key: string]: string | string[];
}

interface Field {
  field_code: string;
  field_name: string;
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
}

const DynamicTable = ({
  fields,
  rows = [],
  is_displaying_metadata_column,
  currentPage = 1,
  totalPages = 1,
  loading,
  innerWidth,
  actionButtonOpen,
  setActionButtonOpen,
  routeParams
}: DynamicTableProps) => {
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
};

type FilterItem = {
  [key: string]: {
    value: string;
    operator: "equal" | "contains";
  };
};

type FiltersState = [{
  filter_item: FilterItem;
}];

type FilterBuilderProps = {
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
};

export default function DynamicPage() {
  const params = useParams<RouteParams>();
  const { tenantCode, productCode, objectCode, viewContentCode } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [innerWidth, setInnerWidth] = useState<number | null>(null);

  const [tenantData, setTenantData] = useState<any>(null);
  const [responseLayout, setResponseLayout] = useState<any>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [viewContent, setViewContent] = useState<any>(null);
  const [viewLayout, setViewLayout] = useState<any>(null);

  const [isAPIResponseAccordionOpen, setIsAPIResponseAccordionOpen] = useState(false);
  const [isAPIResponseDataAccordionOpen, setIsAPIResponseDataAccordionOpen] = useState(false);
  const [isDynamicParamAccordionOpen, setIsDynamicParamAccordionOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1)
  const [actionButtonOpen, setActionButtonOpen] = useState<boolean[]>([]);
  const [selectedFieldPerGroup, setSelectedFieldPerGroup] = useState<Record<string, string>>({});

  const handlePageClick = (pageIndex: any) => {
    let selectedPage = pageIndex.selected + 1;

    fetchData(responseLayout, selectedPage)
  };

  interface FilterItem {
    [key: string]: { value: string; operator: string };
  }

  const [filters, setFilters] = useState<{
    operator: string;
    filter_item: { [key: string]: { value: string; operator: string } | { operator: string; filter_item: any } };
  }[]>([
    {
      operator: "AND",
      filter_item: {},
    },
  ]);

  const [availableFields, setAvailableFields] = useState<{ field_code: string; field_name: string }[]>([]);
  const [selectedField, setSelectedField] = useState("");
  const currentFields = Object.keys(filters[0].filter_item);
  const remainingFields = availableFields.filter((field) => !currentFields.includes(field.field_code));

  const addField = () => {
    if (!selectedField) return;

    setFilters((prev) => {
      const updated = { ...prev[0] };
      updated.filter_item[selectedField] = { value: "", operator: "equal" };
      return [updated];
    });

    setSelectedField("");

    console.log("filters", filters);
  };

  const applyDataFilter = () => {
    console.log(JSON.stringify({ filters }, null, 2))

    setIsSidebarOpen(false);
    setIsLoading(true);
    fetchData(responseLayout, currentPage);
  }

  const addGroup = () => {
    setFilters((prev) => {
      const updated = { ...prev[0] };
      const filterItem = { ...updated.filter_item };

      // Generate unique group name
      let groupIndex = 1;
      let groupKey = `group_${groupIndex}`;
      while (filterItem[groupKey]) {
        groupIndex++;
        groupKey = `group_${groupIndex}`;
      }

      // Add empty group with same structure
      filterItem[groupKey] = {
        operator: "AND",
        filter_item: {}
      };

      updated.filter_item = filterItem;
      return [updated];
    });
  };

  const updateOperator = (field: string, value: string) => {
    setFilters((prev) => {
      const updated = { ...prev[0] };
      updated.filter_item[field].operator = value;
      return [updated];
    });

    console.log("filters", filters);
  };

  const updateField = (field: string, key: "value" | "operator", value: string) => {
    setFilters((prev) => {
      const updated = { ...prev[0] };
      if ('value' in updated.filter_item[field] || 'operator' in updated.filter_item[field]) {
        (updated.filter_item[field] as { value: string; operator: string })[key] = value;
      }
      return [updated];
    });

    console.log("filters", filters);
  };

  const deleteField = (field: string) => {
    setFilters((prev) => {
      const updated = { ...prev[0] };
      delete updated.filter_item[field];
      return [updated];
    });
  };

  const fetchTenant = async () => {
    try {
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}`,
        {
          method: APIMethod.POST,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tenant");
      }

      const data = await response.json();
      const tenantData = data.data;

      setTenantData(tenantData);
    } catch (error) {
      console.error("Tenant API error:", error);
    }
  }

  const fetchLayout = async () => {
    try {
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${objectCode}/view/${viewContentCode}/record`,
        {
          method: APIMethod.POST,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch layout");
      }

      const data = await response.json();
      const layoutData = data.data;

      setResponseLayout(layoutData);
      setViewContent(layoutData.view_content);
      setViewLayout(layoutData.layout);

      // iterate through layout children to find fields
      const fields = layoutData.fields || [];
      const is_including_metadata_column = layoutData.layout?.children?.[0]?.props?.is_displaying_metadata_column;

      for (const field of fields) {
        if (
          field.field_code &&
          !availableFields.some(f => f.field_code === field.field_code) &&
          (is_including_metadata_column || !metadataColumnList.includes(field.field_code))
        ) {
          availableFields.push({
            field_code: field.field_code,
            field_name: field.field_name,
          });
        }
      }

      setAvailableFields(availableFields);

      // setup dynamic page title based on object and tenant
      document.title = `${layoutData.view_content.object.display_name ? layoutData.view_content.object.display_name : toLabel(objectCode)} (${layoutData.view_content.name}) - ${layoutData.view_content.tenant.name}`;

      // Setelah layout selesai, baru fetch data
      await fetchData(layoutData, currentPage);
    } catch (error) {
      console.error("Layout API error:", error);
      setResponseLayout({ error: (error as Error).message });
    }
  };

  const fetchData = async (layoutData: any, page: number) => {
    try {
      setIsLoading(true)

      const dataResponse = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${objectCode}/view/${viewContentCode}/data`,
        {
          method: APIMethod.POST,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: layoutData.layout?.children?.[0]?.props?.fields?.reduce((acc: any, field: any) => {
              acc[field.field_code] = field;
              return acc;
            }, {}) || {},
            filters: filters,
            orders: [],
            page: page ? page : currentPage,
            page_size: 20,
            object_code: objectCode,
            tenant_code: tenantCode,
            product_code: productCode,
            view_content_code: viewContentCode,
          })
        }
      );

      if (!dataResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await dataResponse.json();
      setResponseData(data.data);
      setCurrentPage(data.data?.page);
      setTotalPages(data.data?.total_page);

      setIsLoading(false);
    } catch (error) {
      console.error("Data API error:", error);
      setResponseData({ error: (error as Error).message });
    }
  };

  const addNewItem = () => {
    // redirect to ./add page
    window.location.href = `/${tenantCode}/${productCode}/${objectCode}/${viewContentCode}/add`;
  }

  useEffect(() => {
    if (tenantCode && productCode && objectCode && viewContentCode) {
      fetchTenant();
      fetchLayout();
    }

    setInnerWidth(window.innerWidth);
  }, [tenantCode, productCode, objectCode, viewContentCode, innerWidth]);

  type ViewChild = {
    type: string;
    class_name?: string;
    props?: {
      fields?: any[];
      is_displaying_metadata_column?: boolean;
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-left justify-left min-h-screen bg-gray-100"
    >
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-cyan-600 mb-3">
          {viewContent?.object?.display_name ? `${viewContent?.object?.display_name} (${toLabel(viewContentCode)})` : toLabel(objectCode)}
        </h1>

        <div className="space-y-4">
          {viewLayout?.children.map((child: ViewChild, index: number) => {
            if (child.type === "table") {
              return (
                <Card key={index} className="rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.2)] pt-0 pb-4">
                  <CardContent className="p-0 pb-0 overflow-x-auto">
                    <div className="flex justify-end gap-0 mb-2">
                      <button
                        className="cursor-pointer flex items-center gap-2 m-2 bg-cyan-600 text-white px-3 py-2 rounded-lg hover:bg-cyan-800 transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
                        onClick={() => {
                          addNewItem()
                        }}
                      >
                        <PlusCircle size={18} />
                        Add New {toLabel(objectCode)}
                      </button>

                      <button
                        className="cursor-pointer flex items-center gap-2 m-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
                        onClick={() => {
                          setIsSidebarOpen(true);
                        }}
                      >
                        <Filter size={18} />
                        Filter
                      </button>

                      <button
                        className="cursor-pointer flex items-center gap-2 m-2 bg-gray-100 text-gray px-3 py-2 rounded-lg hover:bg-gray-200 transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
                        onClick={() => {
                          fetchData(responseLayout, currentPage)
                        }}
                      >
                        <RefreshCcw size={18} />
                      </button>
                    </div>

                    {/* The SidebarPanel */}
                    <SidebarPanel isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
                      <div className="space-x-2 flex items-center justify-end">
                        {/* here there will be filter UI */}

                        {remainingFields.length > 0 && (
                          <div className="flex items-center gap-2">
                            <select
                              className="flex-1 border rounded px-3 py-3 text-sm rounded-lg"
                              onChange={(e) => {
                                setFilters((prev) => {
                                  let updated = { ...prev[0] };
                                  updated.operator = e.target.value;
                                  return [updated];
                                });
                              }}
                            >
                              <option value="AND">AND &nbsp;&nbsp;</option>
                              <option value="OR">OR &nbsp;&nbsp;</option>
                            </select>

                            <select
                              className="flex-1 border rounded px-3 py-3 text-sm rounded-lg"
                              value={selectedField}
                              onChange={(e) => setSelectedField(e.target.value)}
                            >
                              <option value="">-- Select field to add --</option>
                              {remainingFields.map((field) => (
                                <option key={field.field_code} value={field.field_code}>
                                  {field.field_name}
                                </option>
                              ))}
                            </select>
                            <button
                              className="cursor-pointer shrink-0 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 text-sm flex items-center gap-2 shadow-[0_4px_0_0_rgba(0,0,0,0.5)]"
                              onClick={addField}
                            >
                              <PlusCircle /> Add Field
                            </button>
                            <button
                              className="cursor-pointer shrink-0 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 text-sm flex items-center gap-2 shadow-[0_4px_0_0_rgba(0,0,0,0.5)]"
                              onClick={addGroup}
                            >
                              <PlusCircle /> Add Group
                            </button>
                          </div>
                        )}
                      </div>
                      <Card className="rounded-lg mt-4 shadow-[0_4px_0_0_rgba(0,0,0,0.4)]">
                        <CardContent>
                          {Object.entries(filters[0].filter_item).map(([field, config]) => {
                            // Handle nested group
                            if ("filter_item" in config) {
                              return (
                                <div key={field} className="border p-4 rounded-md mb-4 bg-gray-50">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="font-semibold text-gray-800">{field}</div>
                                    <button
                                      onClick={() => {
                                        setFilters((prev) => {
                                          const updated = { ...prev[0] };
                                          delete updated.filter_item[field];
                                          return [updated];
                                        });
                                      }}
                                      className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                                    >
                                      <TrashIcon size={16} /> Remove Group
                                    </button>
                                  </div>

                                  {/* Add Field inside Group */}
                                  <div className="flex items-center gap-2 mt-4">
                                    {/* Group operator (AND/OR) selector */}
                                    <select
                                      className="flex-1 border rounded px-3 py-3 text-sm rounded-lg"
                                      value={config.operator}
                                      onChange={(e) => {
                                        setFilters((prev) => {
                                          const updated = { ...prev[0] };
                                          updated.filter_item[field].operator = e.target.value;
                                          return [updated];
                                        });
                                      }}
                                    >
                                      <option value="AND">AND</option>
                                      <option value="OR">OR</option>
                                    </select>

                                    <select
                                      className="flex-1 border rounded px-3 py-3 text-sm rounded-lg"
                                      value={selectedFieldPerGroup[field] || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedFieldPerGroup((prev) => ({
                                          ...prev,
                                          [field]: val,
                                        }));
                                      }}
                                    >
                                      <option value="">-- Select field to add --</option>
                                      {remainingFields.map((f) => (
                                        <option key={f.field_code} value={f.field_code}>
                                          {f.field_name}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      className="cursor-pointer shrink-0 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 text-sm flex items-center gap-2 shadow-[0_4px_0_0_rgba(0,0,0,0.5)]"
                                      onClick={() => {
                                        const selected = selectedFieldPerGroup[field];
                                        if (!selected) return;

                                        setFilters((prev) => {
                                          const updated = { ...prev[0] };
                                          if (
                                            "filter_item" in updated.filter_item[field] &&
                                            !(selected in updated.filter_item[field].filter_item)
                                          ) {
                                            updated.filter_item[field].filter_item[selected] = {
                                              operator: "equal",
                                              value: "",
                                            };
                                          }
                                          return [updated];
                                        });

                                        setSelectedFieldPerGroup((prev) => ({
                                          ...prev,
                                          [field]: "",
                                        }));
                                      }}
                                    >
                                      <PlusCircle /> Add Field
                                    </button>
                                  </div>

                                  {/* Inner fields */}
                                  {Object.entries(config.filter_item).map(([subField, subConfig]) => (
                                    <div key={subField} className="flex items-center gap-2 mb-2 mt-4 rounded-md">
                                      <div className="w-1/4 border rounded px-3 py-3 mb-2 text-sm rounded-lg">{subField}</div>

                                      {/* Operator selector */}
                                      <select
                                        value={(subConfig as { operator: string }).operator}
                                        onChange={(e) => {
                                          const newVal = e.target.value;
                                          setFilters((prev) => {
                                            const updated = { ...prev[0] };
                                            if ("filter_item" in updated.filter_item[field]) {
                                              updated.filter_item[field].filter_item[subField].operator = newVal;
                                            }
                                            return [updated];
                                          });
                                        }}
                                        className="border rounded px-3 py-3 mb-2 text-sm rounded-lg"
                                      >
                                        <option value="equal">Equal</option>
                                        <option value="contains">Contains</option>
                                        <option value="greater_than">Greater Than</option>
                                        <option value="less_than">Less Than</option>
                                        {/* ...other ops */}
                                      </select>

                                      {/* Value input */}
                                      <input
                                        className="flex-1 border rounded px-3 py-3 mb-2 text-sm rounded-lg"
                                        value={(subConfig as { value: string }).value}
                                        onChange={(e) => {
                                          const newVal = e.target.value;
                                          setFilters((prev) => {
                                            const updated = { ...prev[0] };
                                            if ("filter_item" in updated.filter_item[field]) {
                                              updated.filter_item[field].filter_item[subField].value = newVal;
                                            }
                                            return [updated];
                                          });
                                        }}
                                      />

                                      {/* Delete subfield button */}
                                      <button
                                        onClick={() => {
                                          setFilters((prev) => {
                                            const updated = { ...prev[0] };
                                            if ("filter_item" in updated.filter_item[field]) {
                                              delete updated.filter_item[field].filter_item[subField];
                                            }
                                            return [updated];
                                          });
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <TrashIcon size={16} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              );
                            }

                            return (
                              <div key={field} className="flex items-center gap-2">
                                <div className="w-1/4 text-md font-medium text-gray-700 border rounded-md px-3 py-3 mb-2 text-sm">
                                  {field}
                                </div>
                                <select
                                  className="border rounded px-3 py-3 mb-2 text-sm rounded-lg"
                                  value={config.operator}
                                  onChange={(e) => updateOperator(field, e.target.value)}
                                >
                                  <option value="equal">Equal</option>
                                  <option value="contains">Contains</option>
                                  <option value="greater_than">Greater Than</option>
                                  <option value="greater_than_equal">Greater Than or Equal</option>
                                  <option value="less_than">Less Than</option>
                                  <option value="less_than_equal">Less Than or Equal</option>
                                  <option value="empty">Empty</option>
                                  <option value="not_empty">Not Empty</option>
                                </select>
                                <input
                                  className="border rounded px-3 py-3 mb-2 text-sm w-1/2 rounded-lg"
                                  placeholder="value"
                                  value={"value" in config ? config.value : ""}
                                  onChange={(e) => updateField(field, "value", e.target.value)}
                                />
                                <button
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
                                  onClick={() => deleteField(field)}
                                >
                                  <TrashIcon size={16} />
                                </button>
                              </div>
                            )
                          })}
                        </CardContent>
                      </Card>
                      <div className="flex justify-end gap-2 pt-4">
                        <button
                          onClick={() => setIsSidebarOpen(false)}
                          className="px-4 flex items-center py-2 gap-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 cursor-pointer transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
                        >
                          <XCircle size={18} /> Cancel
                        </button>

                        <button
                          onClick={() => applyDataFilter()}
                          className="px-4 flex items-center gap-2 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 cursor-pointer transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
                        >
                          <CheckCircle size={18} /> Apply
                        </button>
                      </div>
                    </SidebarPanel>

                    <DynamicTable
                      fields={child.props?.fields || []}
                      rows={responseData?.items || []}
                      is_displaying_metadata_column={child.props?.is_displaying_metadata_column}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      loading={isLoading}
                      innerWidth={innerWidth || 0}
                      actionButtonOpen={actionButtonOpen}
                      setActionButtonOpen={setActionButtonOpen}
                      routeParams={{
                        tenantCode,
                        productCode,
                        objectCode,
                        viewContentCode
                      }}
                    />

                    <div className="flex justify-end mt-4 mr-4 pb-4">
                      <ReactPaginate
                        containerClassName="flex space-x-2 items-center text-sm"
                        pageClassName="px-3 py-1 rounded cursor-pointer rounded-md border"
                        activeClassName="bg-blue-500 text-white active cursor-pointer rounded-md shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
                        previousClassName="px-3 py-1 border rounded cursor-pointer rounded-md shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
                        nextClassName="px-3 py-1 border rounded cursor-pointer rounded-md shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
                        breakClassName="px-3 py-1"
                        disabledClassName="opacity-50 cursor-not-allowed"
                        previousLabel="Prev"
                        nextLabel="Next"
                        breakLabel={'...'}
                        pageCount={totalPages} // Total number of pages
                        marginPagesDisplayed={2}
                        pageRangeDisplayed={5}
                        onPageChange={handlePageClick}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })}
        </div>

        {dashboardConfig.isDebugMode &&
          <Card className="rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.2)] pt-0 pb-4 mt-4">
            <CardContent className="p-4 pb-0 overflow-x-auto">
              <div className="mt-4">
                <button
                  onClick={() => setIsDynamicParamAccordionOpen(!isDynamicParamAccordionOpen)}
                  className="w-full flex justify-between items-center text-left bg-indigo-100 px-4 py-2 rounded-lg font-semibold text-gray-800 hover:bg-indigo-200 transition"
                >
                  <span>Dynamic Param</span>
                  <span>{isDynamicParamAccordionOpen ? "−" : "+"}</span>
                </button>

                {isDynamicParamAccordionOpen && (
                  <pre className="mt-2 bg-gray-200 text-sm p-4 rounded overflow-auto text-gray-800">
                    <div className="space-y-3 text-gray-700">
                      <p>
                        <span className="font-semibold">Tenant Code:</span>{" "}
                        <span className="text-indigo-600">{tenantCode}</span>
                      </p>
                      <p>
                        <span className="font-semibold">Product Code:</span>{" "}
                        <span className="text-indigo-600">{productCode}</span>
                      </p>
                      <p>
                        <span className="font-semibold">Object Code:</span>{" "}
                        <span className="text-indigo-600">{objectCode}</span>
                      </p>
                      <p>
                        <span className="font-semibold">View Content Code:</span>{" "}
                        <span className="text-indigo-600">{viewContentCode}</span>
                      </p>
                    </div>
                  </pre>
                )}
              </div>

              <div className="mt-4">
                <button
                  onClick={() => setIsAPIResponseAccordionOpen(!isAPIResponseAccordionOpen)}
                  className="w-full flex justify-between items-center text-left bg-indigo-100 px-4 py-2 rounded-lg font-semibold text-gray-800 hover:bg-indigo-200 transition"
                >
                  <span>Layout API Response</span>
                  <span>{isAPIResponseAccordionOpen ? "−" : "+"}</span>
                </button>

                {isAPIResponseAccordionOpen && (
                  <SyntaxHighlighter
                    language="json"
                    style={vscDarkPlus}
                    showLineNumbers
                    wrapLines
                    customStyle={{
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      fontSize: '0.875rem',
                      backgroundColor: '#1e1e1e'
                    }}
                  >
                    {JSON.stringify(responseLayout, null, 2)}
                  </SyntaxHighlighter>
                )}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setIsAPIResponseDataAccordionOpen(!isAPIResponseDataAccordionOpen)}
                  className="w-full flex justify-between items-center text-left bg-indigo-100 px-4 py-2 rounded-lg font-semibold text-gray-800 hover:bg-indigo-200 transition"
                >
                  <span>Data API Response</span>
                  <span>{isAPIResponseDataAccordionOpen ? "−" : "+"}</span>
                </button>

                {isAPIResponseDataAccordionOpen && (
                  <SyntaxHighlighter
                    language="json"
                    style={vscDarkPlus}
                    showLineNumbers
                    wrapLines
                    customStyle={{
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      fontSize: '0.875rem',
                      backgroundColor: '#1e1e1e'
                    }}
                  >
                    {JSON.stringify(responseData, null, 2)}
                  </SyntaxHighlighter>
                )}
              </div>
            </CardContent>
          </Card>
        }
      </div>
    </motion.div>
  );
}
