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
  onChange
}: DropdownProps) {
  const params = useParams<RouteParams>();
  const { tenantCode, productCode } = params;
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const fetchOptions = async (keyword: string = "") => {
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
            query: {},
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
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((keyword: string) => {
      setIsSearching(true);
      fetchOptions(keyword);
    }, 500),
    [tenantCode, productCode, objectCode, viewContentCode, fieldName, fieldValue, query]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value;
    setSearchKeyword(keyword);
    debouncedSearch(keyword);
  };

  useEffect(() => {
    fetchOptions();
  }, [tenantCode, productCode, objectCode, viewContentCode, fieldName, fieldValue, query]);

  return (
    <div className="space-y-2">
      <Select onValueChange={onChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <div className="flex items-center px-3 pb-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search..."
              value={searchKeyword}
              onChange={handleSearchChange}
              className="h-8"
            />
          </div>
          {loading || isSearching ? (
            <SelectItem value="loading" disabled>Loading...</SelectItem>
          ) : error ? (
            <SelectItem value="error" disabled>Error: {error}</SelectItem>
          ) : options.length === 0 ? (
            <SelectItem value="no-options" disabled>No options available</SelectItem>
          ) : (
            options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
} 