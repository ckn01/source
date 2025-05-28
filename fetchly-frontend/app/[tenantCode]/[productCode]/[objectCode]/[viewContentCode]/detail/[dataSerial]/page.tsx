"use client";

import { dashboardConfig } from "@/app/appConfig";
import { DynamicTable } from "@/app/components/elements/DynamicTable";
import DynamicDetail from "@/app/components/ui/DynamicDetail";
import LoadingOverlay from "@/app/components/ui/LoadingOverlay";
import SidebarPanel from "@/components/SidebarPanel";
import { Card, CardContent } from "@/components/ui/card";
import { toLabel } from "@/lib/utils";
import { ArrowLeftCircle, CheckCircle, Filter, Pencil, PlusCircle, RefreshCcw, TrashIcon, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
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
    objectCode?: string;
    viewContentCode?: string;
    filters?: any[];
    fixHeight?: string;
    maxHeight?: string;
    title?: string;
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
  const [buttonColors, setButtonColors] = useState({
    primary: '#0891b2',
    secondary: '#4b5563',
    hoverPrimary: '#0e7490',
    hoverSecondary: '#374151',
    textColor: 'light' as 'dark' | 'light'
  });

  // Child table filter states
  const [childTableFilters, setChildTableFilters] = useState<Record<string, any>>({});
  const [childAvailableFields, setChildAvailableFields] = useState<Record<string, { field_code: string; field_name: string; field_order?: number }[]>>({});
  const [childSelectedField, setChildSelectedField] = useState<Record<string, string>>({});
  const [selectedFieldPerGroup, setSelectedFieldPerGroup] = useState<Record<string, string>>({});
  const [activeChildObjectCode, setActiveChildObjectCode] = useState<string>("");
  const [childTableLayouts, setChildTableLayouts] = useState<Record<string, any>>({});

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

  const [isLayoutLoading, setIsLayoutLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [tableFilters, setTableFilters] = useState<any[]>([]);

  const [actionButtonOpen, setActionButtonOpen] = useState<boolean[]>([]);

  const [tableData, setTableData] = useState<any>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [tablePage, setTablePage] = useState(1);

  // Helper functions for child table filters
  const getChildTableKey = (childObjectCode: string, childViewContentCode: string) => {
    return `${childObjectCode}_${childViewContentCode}`;
  };

  const initializeChildTableFilters = (childObjectCode: string, childViewContentCode: string) => {
    const key = getChildTableKey(childObjectCode, childViewContentCode);
    if (!childTableFilters[key]) {
      setChildTableFilters(prev => ({
        ...prev,
        [key]: [{
          operator: "AND",
          filter_item: {},
        }]
      }));
    }
  };

  const addChildField = (childObjectCode: string, childViewContentCode: string) => {
    const key = getChildTableKey(childObjectCode, childViewContentCode);
    const selectedField = childSelectedField[key];
    if (!selectedField) return;

    setChildTableFilters(prev => {
      const currentFilters = prev[key] || [{ operator: "AND", filter_item: {} }];
      const updated = { ...currentFilters[0] };
      updated.filter_item[selectedField] = { value: "", operator: "equal" };
      return {
        ...prev,
        [key]: [updated]
      };
    });

    setChildSelectedField(prev => ({
      ...prev,
      [key]: ""
    }));
  };

  const addChildGroup = (childObjectCode: string, childViewContentCode: string) => {
    const key = getChildTableKey(childObjectCode, childViewContentCode);
    setChildTableFilters(prev => {
      const currentFilters = prev[key] || [{ operator: "AND", filter_item: {} }];
      const updated = { ...currentFilters[0] };
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
      return {
        ...prev,
        [key]: [updated]
      };
    });
  };

  const updateChildField = (childObjectCode: string, childViewContentCode: string, field: string, key: "value" | "operator", value: string) => {
    const tableKey = getChildTableKey(childObjectCode, childViewContentCode);
    setChildTableFilters(prev => {
      const currentFilters = prev[tableKey] || [{ operator: "AND", filter_item: {} }];
      const updated = { ...currentFilters[0] };
      if ('value' in updated.filter_item[field] || 'operator' in updated.filter_item[field]) {
        (updated.filter_item[field] as { value: string; operator: string })[key] = value;
      }
      return {
        ...prev,
        [tableKey]: [updated]
      };
    });
  };

  const deleteChildField = (childObjectCode: string, childViewContentCode: string, field: string) => {
    const tableKey = getChildTableKey(childObjectCode, childViewContentCode);
    setChildTableFilters(prev => {
      const currentFilters = prev[tableKey] || [{ operator: "AND", filter_item: {} }];
      const updated = { ...currentFilters[0] };
      delete updated.filter_item[field];
      return {
        ...prev,
        [tableKey]: [updated]
      };
    });
  };

  const applyChildDataFilter = (childObjectCode: string, childViewContentCode: string) => {
    setIsSidebarOpen(false);
    const tableComponent = viewLayout?.children?.find((child: any) =>
      child.type === "table" &&
      (child.props?.objectCode || objectCode) === childObjectCode &&
      (child.props?.viewContentCode || viewContentCode) === childViewContentCode
    );
    if (tableComponent) {
      fetchTableData(tableComponent, 1);
    }
  };

  const fetchChildTableLayout = async (childObjectCode: string, childViewContentCode: string) => {
    try {
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${childObjectCode}/view/${childViewContentCode}/record`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch child table layout");
      }

      const data = await response.json();
      const layoutData = data.data;

      // Get fields from the child table layout
      const fields = layoutData.fields || [];
      const is_including_metadata_column = layoutData.layout?.children?.[0]?.props?.is_displaying_metadata_column;

      const childAvailableFieldsList: { field_code: string; field_name: string; field_order?: number }[] = [];
      for (const field of fields) {
        if (
          field.field_code &&
          !childAvailableFieldsList.some(f => f.field_code === field.field_code) &&
          (is_including_metadata_column || !metadataColumnList.includes(field.field_code))
        ) {
          childAvailableFieldsList.push({
            field_code: field.field_code,
            field_name: field.field_name,
            field_order: field.field_order
          });
        }
      }

      return {
        fields: childAvailableFieldsList,
        layoutData: layoutData
      };
    } catch (error) {
      console.error("Child table layout API error:", error);
      return {
        fields: [],
        layoutData: null
      };
    }
  };

  const fetchLayout = async () => {
    try {
      setIsLayoutLoading(true);
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

      // Process table filters from layout
      const tableComponent = layoutData.layout?.children?.find((child: any) => child.type === "table");
      if (tableComponent) {
        // Initialize child table fields and filters
        const childObjectCode = tableComponent.props?.objectCode || objectCode;
        const childViewContentCode = tableComponent.props?.viewContentCode || viewContentCode;
        const tableKey = getChildTableKey(childObjectCode, childViewContentCode);

        // Fetch child table layout and fields from backend
        const childTableInfo = await fetchChildTableLayout(childObjectCode, childViewContentCode);

        setChildAvailableFields(prev => ({
          ...prev,
          [tableKey]: childTableInfo.fields
        }));

        // Store child table layout
        setChildTableLayouts(prev => ({
          ...prev,
          [tableKey]: childTableInfo.layoutData
        }));

        // Initialize filters for this child table
        initializeChildTableFilters(childObjectCode, childViewContentCode);

        // Fetch table data
        await fetchTableData(tableComponent);
      }

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
      setIsLayoutLoading(false);
    } catch (error) {
      console.error("Layout API error:", error);
      setResponseLayout({ error: (error as Error).message });
      setIsLayoutLoading(false);
    }
  };

  const fetchData = async (layoutData: any, page: number) => {
    try {
      setIsDataLoading(true);

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

      setIsDataLoading(false);
    } catch (error) {
      console.error("Data API error:", error);
      setResponseData({ error: (error as Error).message });
      setIsDataLoading(false);
    }
  };

  const fetchTableData = async (tableComponent: ViewChild, page: number = 1) => {
    try {
      setTableLoading(true);
      const childObjectCode = tableComponent.props?.objectCode || objectCode;
      const childViewContentCode = tableComponent.props?.viewContentCode || viewContentCode;
      const tableKey = getChildTableKey(childObjectCode, childViewContentCode);

      // Get filters for this specific child table
      const currentFilters = childTableFilters[tableKey] || [{
        operator: "AND",
        filter_item: {},
      }];

      // Transform filters to match the required structure
      const formattedFilters = currentFilters.map((filter: any) => ({
        operator: filter.operator,
        filter_item: Object.entries(filter.filter_item).reduce((acc, [key, value]: [string, any]) => {
          if (typeof value === 'object' && value !== null && 'filter_item' in value) {
            // Handle nested groups
            acc[key] = {
              operator: (value as any).operator,
              filter_item: (value as any).filter_item
            };
          } else {
            // Handle regular fields
            acc[key] = {
              value: (value as any).value,
              operator: (value as any).operator
            };
          }
          return acc;
        }, {} as Record<string, any>)
      }));

      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${childObjectCode}/view/${childViewContentCode}/data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filters: [
              ...formattedFilters,
              ...(tableComponent.props?.filters?.map((filter: any) => ({
                ...filter,
                filter_item: Object.entries(filter.filter_item).reduce((acc: any, [key, value]: [string, any]) => {
                  if (typeof value === 'object' && value.value?.startsWith('${')) {
                    const paramName = value.value.slice(2, -1);
                    acc[key] = {
                      ...value,
                      value: paramName === 'serial' ? dataSerial : params[paramName] || ''
                    };
                  } else {
                    acc[key] = value;
                  }
                  return acc;
                }, {})
              })) || [])
            ],
            orders: [],
            page: page,
            page_size: 20,
            object_code: childObjectCode,
            tenant_code: tenantCode,
            product_code: productCode,
            view_content_code: childViewContentCode,
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch table data");
      }

      const data = await response.json();
      setTableData(data.data);
      setTableLoading(false);
    } catch (error) {
      console.error("Table Data API error:", error);
      setTableData({ error: (error as Error).message });
      setTableLoading(false);
    }
  };

  const handleTablePageClick = (tableComponent: ViewChild) => (event: { selected: number }) => {
    const newPage = event.selected + 1;
    setTablePage(newPage);
    fetchTableData(tableComponent, newPage);
  };

  const addNewChildItem = (childObjectCode: string, childViewContentCode: string) => {
    // redirect to child object add page
    window.location.href = `/${tenantCode}/${productCode}/${childObjectCode}/${childViewContentCode}/add`;
  }

  useEffect(() => {
    if (tenantCode && productCode && objectCode && viewContentCode) {
      fetchLayout();
    }

    setInnerWidth(window.innerWidth);
  }, [tenantCode, productCode, objectCode, viewContentCode, innerWidth]);

  return (
    <div className="flex flex-col items-left justify-left min-h-screen bg-gray-100">
      <LoadingOverlay isLoading={isLayoutLoading || isDataLoading || tableLoading} />
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
            } else if (child.type === "table") {
              const fields = child.props?.fields || [];
              const childObjectCode = child.props?.objectCode || objectCode;
              const childViewContentCode = child.props?.viewContentCode || viewContentCode;
              const tableKey = getChildTableKey(childObjectCode, childViewContentCode);

              // Initialize filters for this child table if not exists
              if (!childTableFilters[tableKey]) {
                initializeChildTableFilters(childObjectCode, childViewContentCode);
              }

              // Get available fields for this child table
              const currentChildFilters = childTableFilters[tableKey] || [{ operator: "AND", filter_item: {} }];
              const currentChildFields = Object.keys(currentChildFilters[0].filter_item);
              const childFields = childAvailableFields[tableKey] || [];
              const remainingChildFields = childFields.filter((field) => !currentChildFields.includes(field.field_code));

              // Get child table fields
              const childTableLayout = childTableLayouts[tableKey];
              const childTableFields = childTableLayout?.layout?.children?.[0]?.props?.fields || childTableLayout?.fields || [];

              return (
                <Card key={index} className="rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.2)]">
                  <CardContent className="pt-6 pb-6">
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {child.props?.title || `${toLabel(childObjectCode)}`}
                      </h2>
                    </div>
                    <div className="flex justify-end gap-0 mb-2">
                      <button
                        className="cursor-pointer flex items-center gap-2 m-2 px-3 py-2 rounded-lg transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none hover:brightness-110"
                        onClick={() => {
                          addNewChildItem(childObjectCode, childViewContentCode)
                        }}
                        style={{
                          backgroundColor: buttonColors.primary,
                          color: buttonColors.textColor === 'dark' ? '#1f2937' : '#ffffff'
                        }}
                      >
                        <PlusCircle size={18} />
                        Add New {toLabel(childObjectCode)}
                      </button>

                      <button
                        className="cursor-pointer flex items-center gap-2 m-2 px-3 py-2 rounded-lg transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none hover:brightness-110"
                        onClick={() => {
                          setActiveChildObjectCode(tableKey);
                          setIsSidebarOpen(true);
                        }}
                        style={{
                          backgroundColor: buttonColors.secondary,
                          color: buttonColors.textColor === 'dark' ? '#1f2937' : '#ffffff'
                        }}
                      >
                        <Filter size={18} />
                        Filter
                      </button>

                      <button
                        className="cursor-pointer flex items-center gap-2 m-2 bg-gray-100 text-gray px-3 py-2 rounded-lg hover:bg-gray-200 transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
                        onClick={() => {
                          fetchTableData(child, tablePage)
                        }}
                      >
                        <RefreshCcw size={18} />
                      </button>
                    </div>

                    {/* The SidebarPanel for child table filters */}
                    <SidebarPanel isOpen={isSidebarOpen && activeChildObjectCode === tableKey} onClose={() => setIsSidebarOpen(false)}>
                      <div className="space-x-2 flex items-center justify-end">
                        {/* Filter UI for child table */}
                        {remainingChildFields.length > 0 && (
                          <div className="flex items-center gap-2">
                            <select
                              className="flex-1 border rounded px-3 py-3 text-sm rounded-lg"
                              onChange={(e) => {
                                setChildTableFilters((prev) => {
                                  const currentFilters = prev[tableKey] || [{ operator: "AND", filter_item: {} }];
                                  const updated = { ...currentFilters[0] };
                                  updated.operator = e.target.value;
                                  return {
                                    ...prev,
                                    [tableKey]: [updated]
                                  };
                                });
                              }}
                            >
                              <option value="AND">AND &nbsp;&nbsp;</option>
                              <option value="OR">OR &nbsp;&nbsp;</option>
                            </select>

                            <select
                              className="flex-1 border rounded px-3 py-3 text-sm rounded-lg"
                              value={childSelectedField[tableKey] || ""}
                              onChange={(e) => setChildSelectedField(prev => ({
                                ...prev,
                                [tableKey]: e.target.value
                              }))}
                            >
                              <option value="">-- Select field to add --</option>
                              {remainingChildFields.map((field) => (
                                <option key={field.field_code} value={field.field_code}>
                                  {field.field_name}
                                </option>
                              ))}
                            </select>
                            <button
                              className="cursor-pointer shrink-0 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 text-sm flex items-center gap-2 shadow-[0_4px_0_0_rgba(0,0,0,0.5)]"
                              onClick={() => addChildField(childObjectCode, childViewContentCode)}
                            >
                              <PlusCircle /> Add Field
                            </button>
                            <button
                              className="cursor-pointer shrink-0 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 text-sm flex items-center gap-2 shadow-[0_4px_0_0_rgba(0,0,0,0.5)]"
                              onClick={() => addChildGroup(childObjectCode, childViewContentCode)}
                            >
                              <PlusCircle /> Add Group
                            </button>
                          </div>
                        )}
                      </div>
                      <Card className="rounded-lg mt-4 shadow-[0_4px_0_0_rgba(0,0,0,0.4)]">
                        <CardContent>
                          {Object.entries(currentChildFilters[0].filter_item).map(([field, config]) => {
                            // Handle nested group
                            if (typeof config === 'object' && config !== null && "filter_item" in config) {
                              return (
                                <div key={field} className="border p-4 rounded-md mb-4 bg-gray-50">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="font-semibold text-gray-800">{field}</div>
                                    <button
                                      onClick={() => {
                                        deleteChildField(childObjectCode, childViewContentCode, field);
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
                                      value={(config as any).operator}
                                      onChange={(e) => {
                                        setChildTableFilters((prev) => {
                                          const currentFilters = prev[tableKey] || [{ operator: "AND", filter_item: {} }];
                                          const updated = { ...currentFilters[0] };
                                          (updated.filter_item[field] as any).operator = e.target.value;
                                          return {
                                            ...prev,
                                            [tableKey]: [updated]
                                          };
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
                                      {remainingChildFields.map((f) => (
                                        <option key={f.field_code} value={f.field_code}>
                                          {f.field_name}
                                        </option>
                                      ))}
                                    </select>

                                    <button
                                      className="cursor-pointer shrink-0 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 text-sm flex items-center gap-2 shadow-[0_4px_0_0_rgba(0,0,0,0.5)]"
                                      onClick={() => {
                                        const selectedField = selectedFieldPerGroup[field];
                                        if (selectedField) {
                                          setChildTableFilters((prev) => {
                                            const currentFilters = prev[tableKey] || [{ operator: "AND", filter_item: {} }];
                                            const updated = { ...currentFilters[0] };
                                            (updated.filter_item[field] as any).filter_item[selectedField] = { value: "", operator: "equal" };
                                            return {
                                              ...prev,
                                              [tableKey]: [updated]
                                            };
                                          });
                                          setSelectedFieldPerGroup((prev) => ({
                                            ...prev,
                                            [field]: "",
                                          }));
                                        }
                                      }}
                                    >
                                      <PlusCircle /> Add Field
                                    </button>
                                  </div>

                                  {/* Render fields inside the group */}
                                  {Object.entries((config as any).filter_item || {}).map(([groupField, groupConfig]: [string, any]) => (
                                    <div key={groupField} className="flex items-center gap-2 mt-2">
                                      <span className="text-sm font-medium text-gray-700 w-24 shrink-0">
                                        {childFields.find(f => f.field_code === groupField)?.field_name || groupField}
                                      </span>
                                      <select
                                        className="border rounded px-3 py-2 text-sm"
                                        value={groupConfig.operator}
                                        onChange={(e) => {
                                          setChildTableFilters((prev) => {
                                            const currentFilters = prev[tableKey] || [{ operator: "AND", filter_item: {} }];
                                            const updated = { ...currentFilters[0] };
                                            (updated.filter_item[field] as any).filter_item[groupField].operator = e.target.value;
                                            return {
                                              ...prev,
                                              [tableKey]: [updated]
                                            };
                                          });
                                        }}
                                      >
                                        <option value="equal">Equal</option>
                                        <option value="contains">Contains</option>
                                      </select>
                                      <input
                                        type="text"
                                        className="flex-1 border rounded px-3 py-2 text-sm"
                                        placeholder="Enter value"
                                        value={groupConfig.value}
                                        onChange={(e) => {
                                          setChildTableFilters((prev) => {
                                            const currentFilters = prev[tableKey] || [{ operator: "AND", filter_item: {} }];
                                            const updated = { ...currentFilters[0] };
                                            (updated.filter_item[field] as any).filter_item[groupField].value = e.target.value;
                                            return {
                                              ...prev,
                                              [tableKey]: [updated]
                                            };
                                          });
                                        }}
                                      />
                                      <button
                                        className="text-red-500 hover:text-red-700 cursor-pointer"
                                        onClick={() => {
                                          setChildTableFilters((prev) => {
                                            const currentFilters = prev[tableKey] || [{ operator: "AND", filter_item: {} }];
                                            const updated = { ...currentFilters[0] };
                                            delete (updated.filter_item[field] as any).filter_item[groupField];
                                            return {
                                              ...prev,
                                              [tableKey]: [updated]
                                            };
                                          });
                                        }}
                                      >
                                        <TrashIcon size={16} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              );
                            } else {
                              // Handle regular field
                              return (
                                <div key={field} className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium text-gray-700 w-24 shrink-0">
                                    {childFields.find(f => f.field_code === field)?.field_name || field}
                                  </span>
                                  <select
                                    className="border rounded px-3 py-2 text-sm"
                                    value={(config as any).operator}
                                    onChange={(e) => updateChildField(childObjectCode, childViewContentCode, field, "operator", e.target.value)}
                                  >
                                    <option value="equal">Equal</option>
                                    <option value="contains">Contains</option>
                                  </select>
                                  <input
                                    type="text"
                                    className="flex-1 border rounded px-3 py-2 text-sm"
                                    placeholder="Enter value"
                                    value={(config as any).value}
                                    onChange={(e) => updateChildField(childObjectCode, childViewContentCode, field, "value", e.target.value)}
                                  />
                                  <button
                                    className="text-red-500 hover:text-red-700 cursor-pointer"
                                    onClick={() => deleteChildField(childObjectCode, childViewContentCode, field)}
                                  >
                                    <TrashIcon size={16} />
                                  </button>
                                </div>
                              )
                            }
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
                          onClick={() => applyChildDataFilter(childObjectCode, childViewContentCode)}
                          className="px-4 flex items-center gap-2 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 cursor-pointer transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
                        >
                          <CheckCircle size={18} /> Apply
                        </button>
                      </div>
                    </SidebarPanel>

                    <DynamicTable
                      fields={childTableFields}
                      rows={tableData?.items || []}
                      currentPage={tableData?.page || 1}
                      totalPages={tableData?.total_page || 1}
                      is_displaying_metadata_column={child.props?.is_displaying_metadata_column}
                      loading={tableLoading}
                      innerWidth={innerWidth || 0}
                      actionButtonOpen={actionButtonOpen}
                      setActionButtonOpen={setActionButtonOpen}
                      routeParams={{
                        tenantCode: tenantCode as string,
                        productCode: productCode as string,
                        objectCode: childObjectCode,
                        viewContentCode: childViewContentCode
                      }}
                      fixHeight={child.props?.fixHeight}
                      maxHeight={child.props?.maxHeight}
                      refreshData={() => fetchTableData(child)}
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
                        pageCount={tableData?.total_page || 1}
                        marginPagesDisplayed={2}
                        pageRangeDisplayed={5}
                        onPageChange={handleTablePageClick(child)}
                        forcePage={tablePage - 1}
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
    </div>
  );
}