"use client";

import { dashboardConfig } from "@/app/appConfig";
import DynamicDetail from "@/app/components/ui/DynamicDetail";
import { Card, CardContent } from "@/components/ui/card";
import { toLabel } from "@/lib/utils";
import { ArrowLeftCircle, Pencil } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface RouteParams {
  tenantCode: string;
  productCode: string;
  objectCode: string;
  viewContentCode: string;
  dataSerial: string;
  [key: string]: string | string[];
}

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

type ViewChild = {
  type: string;
  class_name?: string;
  props?: {
    fields?: any[];
    is_displaying_metadata_column?: boolean;
  };
};

export default function DynamicPageDetail() {
  const params = useParams<RouteParams>();
  const { tenantCode, productCode, objectCode, viewContentCode, dataSerial } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [innerWidth, setInnerWidth] = useState<number | null>(null);

  const [responseLayout, setResponseLayout] = useState<any>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [viewContent, setViewContent] = useState<any>(null);
  const [viewLayout, setViewLayout] = useState<any>(null);
  const [availableFields, setAvailableFields] = useState<{ field_code: string; field_name: string }[]>([]);
  const [selectedField, setSelectedField] = useState("");
  const [totalPages, setTotalPages] = useState<number>(1);

  const [isAPIResponseAccordionOpen, setIsAPIResponseAccordionOpen] = useState(false);
  const [isAPIResponseDataAccordionOpen, setIsAPIResponseDataAccordionOpen] = useState(false);
  const [isDynamicParamAccordionOpen, setIsDynamicParamAccordionOpen] = useState(false);
  const [buttonColors, setButtonColors] = useState({ primary: '#3b82f6', textColor: 'light' });

  const [filters, setFilters] = useState<{
    operator: string;
    filter_item: { [key: string]: { value: string; operator: string } | { operator: string; filter_item: any } };
  }[]>([
    {
      operator: "AND",
      filter_item: {},
    },
  ]);

  const currentFields = Object.keys(filters[0].filter_item);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchLayout = async () => {
    try {
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${objectCode}/view/${viewContentCode}/detail`,
        {
          method: "POST",
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

      // Set button colors from layout data
      if (layoutData.view_content?.button_colors) {
        setButtonColors(layoutData.view_content.button_colors);
      }

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
      document.title = `Detail ${layoutData.view_content.object.display_name ? layoutData.view_content.object.display_name : toLabel(objectCode)} (${layoutData.view_content.name}) - ${layoutData.view_content.tenant.name}`;

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
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${objectCode}/view/${viewContentCode}/data/detail/${dataSerial}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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

  useEffect(() => {
    if (tenantCode && productCode && objectCode && viewContentCode) {
      fetchLayout();
    }

    setInnerWidth(window.innerWidth);
  }, [tenantCode, productCode, objectCode, viewContentCode, innerWidth]);

  return (
    <div className="flex flex-col items-left justify-left min-h-screen bg-gray-100">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="py-1 px-2 bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 rounded-md border border-gray-100 gap-2 flex items-center transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
              style={{
                cursor: 'pointer'
              }}
            >
              <ArrowLeftCircle size={18} />
            </button>
            <h1 className="text-2xl font-bold text-cyan-600">
              {viewContent?.object?.display_name
                ? `${viewContent?.object?.display_name} (${toLabel(viewContentCode)})`
                : toLabel(objectCode)} Detail
            </h1>
          </div>
          <button
            onClick={() => window.location.href = `/${tenantCode}/${productCode}/${objectCode}/${viewContentCode}/edit/${dataSerial}`}
            className="py-2 px-4 rounded-md gap-2 flex items-center transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
            style={{
              backgroundColor: buttonColors.primary,
              color: buttonColors.textColor === 'dark' ? '#1f2937' : '#ffffff',
              cursor: 'pointer'
            }}
          >
            <Pencil size={18} />
            Edit
          </button>
        </div>

        <div className="space-y-4">
          {viewLayout?.children.map((child: ViewChild, index: number) => {
            if (child.type === "detail") {
              return (
                <Card key={index} className="rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.2)]">
                  <CardContent className="p-6">
                    <DynamicDetail
                      viewComponent={child}
                      viewLayout={viewLayout}
                      responseData={responseData}
                    />
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
    </div>
  );
}