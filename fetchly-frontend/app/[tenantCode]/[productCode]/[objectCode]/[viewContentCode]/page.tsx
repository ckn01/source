"use client";

import { APIMethod, dashboardConfig } from "@/app/appConfig";
import SidebarPanel from "@/components/SidebarPanel";
import { Card, CardContent } from "@/components/ui/card";
import { toLabel } from "@/lib/utils";
import { CheckCircle, Filter, XCircle } from "lucide-react";
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
  is_displaying_metadata_column?: Boolean;
  currentPage?: number;
  totalPages?: number;
  loading?: boolean;
}

const DynamicTable = ({ fields, rows = [], is_displaying_metadata_column, currentPage = 1, totalPages = 1, loading }: DynamicTableProps) => {
  return (
    <div className="relative overflow-x-auto">
      <div className="relative">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-full bg-white/60 flex items-center justify-center z-10">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}

        <table className="table-auto border border-gray-100 whitespace-nowrap">
          <thead>
            <tr className="bg-gray-100">
              {fields.map((field) => {
                if (!is_displaying_metadata_column && metadataColumnList.includes(field.field_code)) {
                  return null; // skip rendering this column
                }

                return (
                  <th
                    key={field.field_code}
                    className="px-2 py-2 border border-gray-100 text-left"
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

                  // If total is less than 1000px (arbitrary threshold for ~100%), pick first visible field to flex
                  if (totalFixedWidth < 1000) {
                    expandableFieldCode = visibleFields[0]?.field_code ?? null;
                  }
                }

                return (
                  <tr key={rowIndex}>
                    {fields.map((field) => {
                      if (!is_displaying_metadata_column && metadataColumnList.includes(field.field_code)) {
                        return null; // skip rendering this column
                      }

                      const rowWidth = field.field_name.length * 10 + 40;
                      const isExpandable = rowIndex === 0 && field.field_code === expandableFieldCode;

                      return (
                        <td
                          key={field.field_code}
                          className="px-2 py-2 border border-gray-100 text-gray-600"
                          style={{
                            minWidth: `${rowWidth}px`,
                            ...(isExpandable ? { width: "100%" } : {})
                          }}
                        >
                          {String(row[field.field_code]?.value ?? "")}
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

  const [responseLayout, setResponseLayout] = useState<any>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [viewContent, setViewContent] = useState<any>(null);
  const [viewLayout, setViewLayout] = useState<any>(null);

  const [isAPIResponseAccordionOpen, setIsAPIResponseAccordionOpen] = useState(false);
  const [isAPIResponseDataAccordionOpen, setIsAPIResponseDataAccordionOpen] = useState(false);
  const [isDynamicParamAccordionOpen, setIsDynamicParamAccordionOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1)

  const handlePageClick = (pageIndex: any) => {
    let selectedPage = pageIndex.selected + 1;

    fetchData(responseLayout, selectedPage)
  };

  interface FilterItem {
    [key: string]: { value: string; operator: string };
  }

  const [filters, setFilters] = useState<{
    operator: string;
    filter_item: FilterItem;
  }[]>([
    {
      operator: "AND",
      filter_item: {},
    },
  ]);

  const availableFields = ["status", "bentuk", "provinsi", "kabupaten", "jenjang"];
  const [selectedField, setSelectedField] = useState("");
  const currentFields = Object.keys(filters[0].filter_item);
  const remainingFields = availableFields.filter((field) => !currentFields.includes(field));

  const addField = () => {
    if (!selectedField) return;
    setFilters((prev) => {
      const updated = { ...prev[0] };
      updated.filter_item[selectedField] = { value: "", operator: "equal" };
      return [updated];
    });
    setSelectedField(""); // reset dropdown after add
  };

  const updateField = (field: string, key: "value" | "operator", value: string) => {
    setFilters((prev) => {
      const updated = { ...prev[0] };
      updated.filter_item[field][key] = value;
      return [updated];
    });
  };

  const deleteField = (field: string) => {
    setFilters((prev) => {
      const updated = { ...prev[0] };
      delete updated.filter_item[field];
      return [updated];
    });
  };

  const fetchLayout = async () => {
    try {
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${objectCode}/view/${viewContentCode}/record`,
        {
          method: APIMethod.POST,
          headers: {
            "Content-Type": "application/json",
          },
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: layoutData.layout?.children?.[0]?.props?.fields?.reduce((acc: any, field: any) => {
              acc[field.field_code] = field;
              return acc;
            }, {}) || {},
            filters: [],
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

  useEffect(() => {
    if (tenantCode && productCode && objectCode && viewContentCode) {
      fetchLayout();
    }
  }, [tenantCode, productCode, objectCode, viewContentCode]);

  type ViewChild = {
    type: string;
    class_name?: string;
    props?: {
      fields?: any[];
      is_displaying_metadata_column?: Boolean;
    };
  };

  return (
    <div className="flex flex-col items-left justify-left min-h-screen bg-gray-100">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-cyan-600 mb-3">
          {viewContent?.object?.display_name ? `${viewContent?.object?.display_name} (${toLabel(viewContentCode)})` : toLabel(objectCode)}
        </h1>


        <div className="space-y-4">
          {viewLayout?.children.map((child: ViewChild, index: number) => {
            if (child.type === "table") {
              return (
                <Card key={index} className="shadow-md pt-0 pb-4">
                  <CardContent className="p-0 pb-0 overflow-x-auto">
                    <div className="flex justify-end gap-2 mb-2">
                      <button
                        className="cursor-pointer flex items-center gap-2 m-2 bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition shadow-md"
                        onClick={() => {
                          setIsSidebarOpen(true);
                        }}
                      >
                        <Filter size={18} />
                        Filter
                      </button>
                    </div>

                    {/* The SidebarPanel */}
                    <SidebarPanel isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
                      <div className="p-2 space-y-4">
                        {/* Dropdown Add Field */}
                        {remainingFields.length > 0 && (
                          <div className="flex items-center gap-2">
                            <select
                              className="flex-1 border rounded px-3 py-3 text-sm rounded-lg"
                              value={selectedField}
                              onChange={(e) => setSelectedField(e.target.value)}
                            >
                              <option value="">-- Select field to add --</option>
                              {remainingFields.map((field) => (
                                <option key={field} value={field}>
                                  {field}
                                </option>
                              ))}
                            </select>
                            <button
                              className="shrink-0 px-3 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 text-sm"
                              onClick={addField}
                            >
                              ➕ Add Field
                            </button>
                          </div>

                        )}

                        <Card>
                          <CardContent>
                            {Object.entries(filters[0].filter_item).map(([field, config]) => (
                              <div key={field} className="flex items-center gap-2">
                                <div className="w-1/4 text-sm font-medium text-gray-700">{field}</div>
                                <select
                                  className="border rounded px-3 py-3 text-sm rounded-lg"
                                  value={config.operator}
                                  onChange={(e) => updateField(field, "operator", e.target.value)}
                                >
                                  <option value="equal">equal</option>
                                  <option value="contains">contains</option>
                                </select>
                                <input
                                  className="border rounded px-3 py-3 text-sm w-1/2 rounded-lg"
                                  placeholder="value"
                                  value={config.value}
                                  onChange={(e) => updateField(field, "value", e.target.value)}
                                />
                                <button
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
                                  onClick={() => deleteField(field)}
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        <div className="flex justify-end gap-2 pt-4">
                          <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="px-4 flex items-center py-2 gap-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 shadow-md cursor-pointer"
                          >
                            <XCircle size={18} /> Cancel
                          </button>

                          <button
                            onClick={() => console.log(JSON.stringify({ filters }, null, 2))}
                            className="px-4 flex items-center gap-2 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 shadow-md cursor-pointer"
                          >
                            <CheckCircle size={18} /> Apply
                          </button>
                          {/* <button
                            onClick={() => console.log(JSON.stringify({ filters }, null, 2))}
                            className="px-4 flex items-center gap-2 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 shadow-md cursor-pointer"
                          >
                            <CheckCircle size={18} /> Apply and Close
                          </button> */}

                          {/* <div className="relative inline-flex shadow-md rounded-lg overflow-hidden">
                            
                            <button
                              onClick={() => console.log(JSON.stringify({ filters }, null, 2))}
                              className="px-4 flex items-center gap-2 py-2 bg-cyan-500 text-white hover:bg-cyan-600"
                            >
                              <CheckCircle size={18} /> Apply
                            </button>

                            
                            <button
                              onClick={() => {
                                setOpen(!open)
                              }}
                              className="px-2 bg-cyan-500 hover:bg-cyan-600 text-white"
                            >
                              <ChevronDown size={18} />
                            </button>

                            
                            {open && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-12">
                                <button
                                  onClick={() => {
                                    console.log(JSON.stringify({ filters }, null, 2));
                                    // You can add any extra logic like closing modal here
                                    setOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <CheckCircle size={18} className="text-cyan-600" />
                                  Apply and Close
                                </button>
                              </div>
                            )}
                          </div> */}
                        </div>
                      </div>
                    </SidebarPanel>

                    <DynamicTable
                      fields={child.props?.fields || []}
                      rows={responseData?.items || []}
                      is_displaying_metadata_column={child.props?.is_displaying_metadata_column}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      loading={isLoading}
                    />

                    <div className="flex justify-end mt-4 mr-4">
                      <ReactPaginate
                        containerClassName="flex space-x-2 items-center text-sm"
                        pageClassName="border px-3 py-1 rounded cursor-pointer"
                        activeClassName="bg-blue-500 text-white active cursor-pointer"
                        previousClassName="px-3 py-1 border rounded cursor-pointer"
                        nextClassName="px-3 py-1 border rounded cursor-pointer"
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
      </div>
    </div>
  );
}
