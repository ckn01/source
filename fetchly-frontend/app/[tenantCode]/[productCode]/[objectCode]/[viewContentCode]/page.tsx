"use client";

import { APIMethod, dashboardConfig } from "@/app/appConfig";
import { Card, CardContent } from "@/components/ui/card";
import { toLabel } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  onPageChange: (page: number) => void;
}

const DynamicTable = ({ fields, rows = [], is_displaying_metadata_column, currentPage = 1, totalPages = 1, onPageChange }: DynamicTableProps) => {
  return (
    <div className="overflow-x-auto">
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
              return (
                <tr key={rowIndex}>
                  {fields.map((field) => {
                    if (!is_displaying_metadata_column && metadataColumnList.includes(field.field_code)) {
                      return null; // skip rendering this column
                    }

                    return (
                      <td
                        key={field.field_code}
                        className="px-2 py-2 border border-gray-100 text-gray-600"
                        style={{
                          minWidth: `${field.field_name.length * 10 + 40}px`,
                        }}
                      >
                        {String(row[field.field_code]?.value ?? "")}
                      </td>
                    )
                  })}
                </tr>
              )
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

      {/* Pagination UI */}
      <div className="flex justify-left mt-4 space-x-2 ml-4">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-3 py-1">{currentPage} / {totalPages}</span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default function DynamicPage() {
  const params = useParams<RouteParams>();
  const { tenantCode, productCode, objectCode, viewContentCode } = params;
  const [isLoading, setIsLoading] = useState(true);

  const [responseLayout, setResponseLayout] = useState<any>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [viewContent, setViewContent] = useState<any>(null);
  const [viewLayout, setViewLayout] = useState<any>(null);

  const [isAPIResponseAccordionOpen, setIsAPIResponseAccordionOpen] = useState(false);
  const [isAPIResponseDataAccordionOpen, setIsAPIResponseDataAccordionOpen] = useState(false);
  const [isDynamicParamAccordionOpen, setIsDynamicParamAccordionOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1)

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
      await fetchData(layoutData);
    } catch (error) {
      console.error("Layout API error:", error);
      setResponseLayout({ error: (error as Error).message });
    }
  };

  const fetchData = async (layoutData: any) => {
    try {
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
            page: currentPage,
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
      setCurrentPage(data.page);
      setTotalPages(data.total_page);

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
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-cyan-600 mb-3">
          {viewContent?.object?.display_name ? viewContent?.object?.display_name : toLabel(objectCode)}
        </h1>

        <div className="space-y-4">
          {viewLayout?.children.map((child: ViewChild, index: number) => {
            if (child.type === "table") {
              return (
                <Card key={index} className="shadow-md">
                  <CardContent className="p-0 pb-0 overflow-x-auto">
                    <DynamicTable
                      fields={child.props?.fields || []}
                      rows={responseData?.items || []}
                      is_displaying_metadata_column={child.props?.is_displaying_metadata_column}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={async (newPage) => {
                        setCurrentPage(newPage);
                        await fetchData(responseLayout);
                      }}
                    />
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
