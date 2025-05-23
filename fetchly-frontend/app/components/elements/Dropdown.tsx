import { dashboardConfig } from "@/app/appConfig";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import debounce from "lodash/debounce";
import { Search } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

// Extend Window interface to include fetchlyFilters
declare global {
  interface Window {
    fetchlyFilters?: {
      [target: string]: {
        [field: string]: {
          value: string;
          operator: string;
        };
      };
    };
  }
}

interface DropdownProps {
  objectCode: string;
  viewContentCode: string;
  fieldName: string;
  fieldValue: string;
  query?: Record<string, any>;
  className?: string;
  onChange?: (value: string) => void;
  size?: 'default' | 'lg';
  placeholder?: string;
  options?: DropdownOption[];
  eventListeners?: {
    onChange?: {
      type: string;
      action: string;
      params: {
        field: string;
        value: string;
      };
      target: string;
    };
  };
}

interface RouteParams {
  tenantCode: string;
  productCode: string;
  objectCode: string;
  viewContentCode: string;
  [key: string]: string | string[];
}

interface DropdownOption {
  label: string;
  value: string;
}

interface ApiResponse {
  data: {
    items: Array<{
      [key: string]: {
        value: string;
        display_value: string;
      };
    }>;
  };
}

export function Dropdown({
  objectCode,
  viewContentCode,
  fieldName,
  fieldValue,
  query = {},
  className,
  onChange,
  size = 'default',
  placeholder = 'Select an option',
  options: initialOptions,
  eventListeners
}: DropdownProps) {
  const params = useParams<RouteParams>();
  const { tenantCode, productCode } = params;
  const [options, setOptions] = useState<DropdownOption[]>(initialOptions || []);
  const [loading, setLoading] = useState(!initialOptions);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(fieldValue || "");

  const fetchOptions = useCallback(async (keyword: string = "") => {
    if (!fieldName || !fieldValue) {
      setError("fieldName and fieldValue are required");
      setLoading(false);
      return;
    }

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
            fields: {
              [fieldName]: { field_code: fieldName },
              [fieldValue]: { field_code: fieldValue }
            },
            filters: keyword ? [{
              "operator": "AND",
              "filter_item": {
                [fieldName]: {
                  "value": keyword,
                  "operator": "contains"
                }
              }
            }] : [],
            object_code: objectCode,
            tenant_code: tenantCode,
            product_code: productCode,
            ...query
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch dropdown options: ${response.statusText}`);
      }

      const data = (await response.json()) as ApiResponse;
      const items = data.data?.items || [];

      if (items.length === 0) {
        console.warn("No options returned from API");
      }

      const mappedOptions = items.map((item) => {
        const label = item[fieldName]?.display_value;
        const value = item[fieldValue]?.value;

        if (!label || !value) {
          console.warn(`Missing label or value for item:`, item);
        }

        return {
          label: label || "",
          value: value || ""
        };
      }).filter(option => option.label && option.value);

      setOptions(mappedOptions);
    } catch (error) {
      console.error("Dropdown options fetch error:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch options");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [tenantCode, productCode, objectCode, viewContentCode, fieldName, fieldValue, query]);

  // Create a simple debounced search function
  const debouncedSearch = useMemo(() => {
    return debounce((keyword: string) => {
      console.log('Debounced search executing with:', keyword);
      setIsSearching(true);

      // Call fetchOptions directly without async/await in debounce
      fetchOptions(keyword).finally(() => {
        setIsSearching(false);
      });
    }, 500);
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value;
    console.log('Search input changed:', keyword);
    setSearchKeyword(keyword);

    if (keyword.trim()) {
      console.log('Calling debounced search with:', keyword);
      debouncedSearch(keyword);
    } else {
      console.log('Search cleared, loading initial options');
      // If search is cleared, cancel pending search and reset to initial options
      debouncedSearch.cancel();
      fetchOptions();
    }
  }, [debouncedSearch]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up debounced search');
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleValueChange = async (value: string | null) => {
    setSelectedValue(value || "");

    if (onChange) {
      onChange(value || "");
    }

    if (eventListeners?.onChange) {
      const { action, params, target } = eventListeners.onChange;

      if (action === 'loadTable') {
        try {
          // Store this dropdown's filter state globally
          if (!window.fetchlyFilters) {
            window.fetchlyFilters = {};
          }

          if (!window.fetchlyFilters[target]) {
            window.fetchlyFilters[target] = {};
          }

          // Update this dropdown's filter
          if (value && value.trim()) {
            window.fetchlyFilters[target][params.field] = {
              value: value,
              operator: "equal"
            };
          } else {
            // Remove filter if value is empty/null
            delete window.fetchlyFilters[target][params.field];
          }

          // Collect all filters for this target
          const allFilters = window.fetchlyFilters[target];
          const hasFilters = Object.keys(allFilters).length > 0;

          // Create combined filter object
          const combinedFilters = hasFilters ? [{
            operator: "AND",
            filter_item: allFilters
          }] : [];

          // Create and dispatch a custom event that can be caught by any component
          const event = new CustomEvent('fetchly:tableDataLoad', {
            detail: {
              target,
              params: {
                filters: combinedFilters
              },
              config: {
                objectCode: target.split('__')[1],
                tenantCode,
                productCode,
                viewContentCode: 'default'
              }
            },
            bubbles: true,
            composed: true
          });

          // Dispatch to window so any component can listen for it
          window.dispatchEvent(event);
          console.log('Combined table load event dispatched:', {
            target,
            filters: combinedFilters,
            allStoredFilters: window.fetchlyFilters[target]
          });
        } catch (error) {
          console.error("Failed to trigger table data load:", error);
        }
      }
    }
  };

  // Initial load of options
  useEffect(() => {
    if (!initialOptions) {
      console.log('Initial options load');
      fetchOptions();
    }

    // Reset global filters when component mounts
    if (eventListeners?.onChange) {
      const { target, params } = eventListeners.onChange;
      if (window.fetchlyFilters && window.fetchlyFilters[target]) {
        delete window.fetchlyFilters[target][params.field];
      }
    }

    // Cleanup function to reset filters when component unmounts
    return () => {
      if (eventListeners?.onChange) {
        const { target, params } = eventListeners.onChange;
        if (window.fetchlyFilters && window.fetchlyFilters[target]) {
          delete window.fetchlyFilters[target][params.field];

          // If no more filters for this target, remove the target entry
          if (Object.keys(window.fetchlyFilters[target]).length === 0) {
            delete window.fetchlyFilters[target];
          }
        }
      }
    };
  }, []);

  return (
    <div className="space-y-2 mb-4">
      <Select onValueChange={handleValueChange} value={selectedValue}>
        <SelectTrigger className={`${className} ${size === 'lg' ? 'h-12 text-lg' : ''} relative`}>
          <SelectValue placeholder={placeholder} />
          {selectedValue && (
            <button
              type="button"
              className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleValueChange("");
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-500 hover:text-gray-700"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </SelectTrigger>
        <SelectContent>
          <div className="flex items-center px-3 pb-2">
            <Search className={`mr-2 shrink-0 opacity-50 ${size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />
            <Input
              placeholder="Search..."
              value={searchKeyword}
              onChange={handleSearchChange}
              className={`${size === 'lg' ? 'h-10 text-lg' : 'h-8'}`}
              onKeyDown={(e) => {
                // Prevent the dropdown from closing when typing
                e.stopPropagation();
              }}
            />
          </div>
          {loading || isSearching ? (
            <SelectItem value="loading" disabled className={size === 'lg' ? 'text-lg py-3' : ''}>Loading...</SelectItem>
          ) : error ? (
            <SelectItem value="error" disabled className={size === 'lg' ? 'text-lg py-3' : ''}>Error: {error}</SelectItem>
          ) : options.length === 0 ? (
            <SelectItem value="no-options" disabled className={size === 'lg' ? 'text-lg py-3' : ''}>No options available</SelectItem>
          ) : (
            options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className={size === 'lg' ? 'text-lg py-3' : ''}
              >
                {option.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
} 