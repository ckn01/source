import { dashboardConfig } from "@/app/appConfig";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckCircle, ChevronRight, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ReactPaginate from 'react-paginate';

interface CardListProps {
  objectCode: string;
  viewContentCode: string;
  autoLoad?: boolean;
  className?: string;
  selectedValue?: string;
  contentArrangement?: 'stacked' | 'overflow' | 'fit';
}

interface RouteParams {
  tenantCode: string;
  productCode: string;
  objectCode: string;
  viewContentCode: string;
  [key: string]: string | string[];
}

interface Field {
  complete_field_code: string;
  field_code: string;
  field_name: string;
  data_type: string;
  value: any;
  display_value: any;
  additional_data: Record<string, any>;
}

interface ApiResponse {
  data: {
    page: number;
    page_size: number;
    total_data: number;
    total_page: number;
    items: Record<string, Field>[];
  };
}

interface LayoutConfig {
  layout: {
    type: string;
    props?: any;
    children?: any[];
  };
  viewContent: {
    name: string;
    object?: {
      display_name?: string;
    };
  };
  fields: Array<{
    field_code: string;
    field_name: string;
    data_type: string;
    is_displayed_in_table: boolean;
    field_order: number;
    render_config?: string;
  }>;
}

export function CardList({
  objectCode,
  viewContentCode,
  autoLoad = true,
  className,
  selectedValue,
  contentArrangement = 'stacked'
}: CardListProps) {
  const params = useParams<RouteParams>();
  const { tenantCode, productCode } = params;
  const [data, setData] = useState<ApiResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig | null>(null);

  const fetchLayoutConfig = async () => {
    try {
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${objectCode}/view/${viewContentCode}/record`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            object_code: objectCode,
            tenant_code: tenantCode,
            product_code: productCode,
            view_content_code: viewContentCode,
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch layout config: ${response.statusText}`);
      }

      const responseData = await response.json();
      setLayoutConfig(responseData.data);
    } catch (error) {
      console.error("CardList layout config fetch error:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch layout config");
    }
  };

  const fetchData = async (filters: any[] = [], page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${objectCode}/view/${viewContentCode}/data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            page,
            page_size: 20,
            object_code: objectCode,
            tenant_code: tenantCode,
            product_code: productCode,
            view_content_code: viewContentCode,
            filters
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const responseData = await response.json();
      setData(responseData.data);
    } catch (error) {
      console.error("CardList data fetch error:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch layout config first
  useEffect(() => {
    fetchLayoutConfig();
  }, [tenantCode, productCode, objectCode, viewContentCode]);

  // Fetch data after layout config is loaded
  useEffect(() => {
    if (layoutConfig && (autoLoad || selectedValue)) {
      fetchData(selectedValue ? [
        {
          operator: "AND",
          filter_item: {
            country_serial: {
              value: selectedValue,
              operator: "equal"
            }
          }
        }
      ] : [], currentPage);
    }
  }, [layoutConfig, tenantCode, productCode, objectCode, viewContentCode, autoLoad, selectedValue, currentPage]);

  // Add event listener for table data load
  useEffect(() => {
    const handleTableDataLoad = (event: CustomEvent) => {
      if (event.detail.target === className) {
        const { params, config } = event.detail;
        setCurrentPage(1); // Reset to first page when filter changes
        fetchData([{
          operator: "AND",
          filter_item: {
            [params.field]: {
              value: params.value,
              operator: "equals"
            }
          }
        }], 1);
      }
    };

    window.addEventListener('fetchly:tableDataLoad', handleTableDataLoad as EventListener);
    return () => {
      window.removeEventListener('fetchly:tableDataLoad', handleTableDataLoad as EventListener);
    };
  }, [className]);

  const handlePageChange = (selectedItem: { selected: number }) => {
    const newPage = selectedItem.selected + 1;
    setCurrentPage(newPage);
  };

  const renderCardContent = (item: Record<string, Field>) => {
    if (!layoutConfig?.fields) return null;

    return layoutConfig.fields
      .filter(field => field.is_displayed_in_table)
      .sort((a, b) => a.field_order - b.field_order)
      .map(field => {
        const fieldCode = field.field_code.split('.')[0];
        const itemField = item[fieldCode];
        if (!itemField?.display_value) return null;

        // Handle custom render config if available
        let displayValue = itemField.display_value;
        if (field.render_config) {
          try {
            displayValue = field.render_config.replace(/\${([^}]+)}/g, (match, fieldName) => {
              const value = item[fieldName]?.display_value || '';
              return value;
            });
          } catch (error) {
            console.error('Error processing render config:', error);
          }
        } else if (field.data_type === 'Bool') {
          displayValue = itemField.value ? (
            <span className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              Yes
            </span>
          ) : (
            <span className="flex items-center text-red-600">
              <XCircle className="w-4 h-4 mr-1" />
              No
            </span>
          );
        }

        return (
          <div
            key={field.field_code}
            className={`
              flex flex-col space-y-1 p-2 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200
              ${contentArrangement === 'stacked' ? 'w-full' : ''}
              ${contentArrangement === 'overflow' ? 'min-w-[200px] flex-shrink-0' : ''}
              ${contentArrangement === 'fit' ? 'flex-1 min-w-[200px]' : ''}
            `}
          >
            <span className="text-xs font-medium text-gray-500 truncate">
              {field.field_name}
            </span>
            <span className="text-lg font-semibold text-gray-900 truncate">
              {displayValue}
            </span>
          </div>
        );
      });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl">
        {error}
      </div>
    );
  }

  if (!data?.items?.length) {
    return (
      <div className="p-4 bg-gray-50 text-gray-600 rounded-xl text-center">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {data.items.map((item, index) => (
          <motion.div
            key={item.serial?.value || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.01 }}
            className="group"
          >
            <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
              <CardContent className="p-4">
                <div className={`
                  ${contentArrangement === 'stacked' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' : ''}
                  ${contentArrangement === 'overflow' ? 'flex overflow-x-auto gap-3 pb-2' : ''}
                  ${contentArrangement === 'fit' ? 'flex flex-wrap gap-3' : ''}
                `}>
                  {renderCardContent(item)}
                </div>
                <div className="mt-3 flex justify-end">
                  <motion.button
                    whileHover={{ x: 5 }}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {data.total_page > 1 && (
        <div className="flex justify-center mt-6">
          <ReactPaginate
            pageCount={data.total_page}
            pageRangeDisplayed={5}
            marginPagesDisplayed={2}
            onPageChange={handlePageChange}
            containerClassName="flex space-x-2"
            pageClassName="px-3 py-1 rounded-md hover:bg-gray-100 cursor-pointer"
            pageLinkClassName="text-gray-700"
            activeClassName="bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
            previousClassName="px-3 py-1 rounded-md hover:bg-gray-100 cursor-pointer"
            nextClassName="px-3 py-1 rounded-md hover:bg-gray-100 cursor-pointer"
            previousLabel="Previous"
            nextLabel="Next"
            breakLabel="..."
            breakClassName="px-3 py-1 cursor-pointer"
            disabledClassName="opacity-50 cursor-not-allowed"
            forcePage={currentPage - 1}
          />
        </div>
      )}
    </div>
  );
} 