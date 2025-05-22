import { dashboardConfig } from "@/app/appConfig";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import debounce from "lodash/debounce";
import { Search } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
    setLoading(true);
    setError(null);

    try {
      if (!fieldName || !fieldValue) {
        throw new Error("fieldName and fieldValue are required");
      }

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

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((keyword: string) => {
      setIsSearching(true);
      fetchOptions(keyword);
    }, 500),
    [fetchOptions]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value;
    setSearchKeyword(keyword);
    debouncedSearch(keyword);
  };

  const handleValueChange = async (value: string) => {
    setSelectedValue(value);

    if (onChange) {
      onChange(value);
    }

    if (eventListeners?.onChange) {
      const { action, params, target } = eventListeners.onChange;

      if (action === 'loadTable') {
        try {
          // Create and dispatch a custom event that can be caught by any component
          const event = new CustomEvent('fetchly:tableDataLoad', {
            detail: {
              target,
              params: {
                field: params.field,
                value: value
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
          console.log('Table load event dispatched:', {
            target,
            params: {
              field: params.field,
              value: value
            }
          });
        } catch (error) {
          console.error("Failed to trigger table data load:", error);
        }
      }
    }
  };

  useEffect(() => {
    if (!initialOptions) {
      fetchOptions();
    }
  }, []);

  return (
    <div className="space-y-2">
      <Select onValueChange={handleValueChange} value={selectedValue}>
        <SelectTrigger className={`${className} ${size === 'lg' ? 'h-12 text-lg' : ''}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <div className="flex items-center px-3 pb-2">
            <Search className={`mr-2 shrink-0 opacity-50 ${size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />
            <Input
              placeholder="Search..."
              value={searchKeyword}
              onChange={handleSearchChange}
              className={`${size === 'lg' ? 'h-10 text-lg' : 'h-8'}`}
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