import { APIMethod, dashboardConfig } from "@/app/appConfig";
import { Card, CardContent } from "@/components/ui/card";
import { toLabel } from "@/lib/utils";
import { Save, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import SidebarPanel from "../SidebarPanel";

interface DynamicFormProps {
  index: number;
  viewComponent: any;
  viewLayout: any;
  responseData: any;
}

interface RouteParams {
  tenantCode: string;
  productCode: string;
  objectCode: string;
  viewContentCode: string;
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

export default function DynamicForm({ index, viewComponent, viewLayout, responseData }: DynamicFormProps) {
  const params = useParams<RouteParams>();
  const {
    tenantCode = dashboardConfig.defaultTenantCode,
    productCode = dashboardConfig.defaultProductCode,
    objectCode = dashboardConfig.defaultObjectCode,
    viewContentCode = dashboardConfig.defaultViewContentCode,
  } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [referenceResponseData, setReferenceResponseData] = useState<Record<string, any>>({});
  const [flattenResponseData, setFlattenResponseData] = useState(null)
  const [currentReferenceObjectCode, setCurrentReferenceObjectCode] = useState<string>("");
  const [inputValue, setInputValue] = useState<Record<string, string | undefined>>({});
  const [defaultOptions, setDefaultOptions] = useState<Record<string, any>>({});
  const [localResponseData, setLocalResponseData] = useState<Record<string, any>>(responseData);
  const [localViewComponent, setLocalViewComponent] = useState<any>(viewComponent)

  const fetchData = async (page: number, referenceObjectCode: string, filters: any) => {
    try {
      setIsLoading(true)

      const dataResponse = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${referenceObjectCode}/view/${viewContentCode}/data`,
        {
          method: APIMethod.POST,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filters: filters,
            page: page ? page : 1,
            page_size: 20,
            object_code: referenceObjectCode,
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

      setReferenceResponseData((prevData) => ({
        ...prevData,
        [referenceObjectCode]: data.data,
      }));
    } catch (error) {
      console.error("Data API error:", error);
    }
  };

  useEffect(() => {
    if (tenantCode && productCode && objectCode && viewContentCode && localViewComponent) {
      localViewComponent.props?.fields?.map((field: any, idx: number) => {
        // checking if field.foreign_table_name and field.foreign_field_name exist
        if (field.foreign_table_name && field.foreign_field_name) {
          fetchData(1, field.foreign_table_name, null);
        }
      })
    }
  }, [tenantCode, productCode, objectCode, viewContentCode, localViewComponent]);

  useEffect(() => {
    const data = referenceResponseData;
    if (data) {
      // Do something with the new data

    }
  }, [referenceResponseData]);

  useEffect(() => {
    if (responseData) {
      setLocalResponseData(responseData);
      setIsLoading(false);
    }
  }, [responseData]);

  useEffect(() => {
    const data = localResponseData;
    if (data) {
      // Do something with the new data
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          setInputValue((prevData) => ({
            ...prevData,
            [key]: data[key]?.display_value,
          }))
        }
      }

      console.log("current local data", data)
    }
  }, [localResponseData]);

  useEffect(() => {
    if (inputValue) {
      // Do something with the new data
      console.log("inputValue", inputValue)
    }
  }, [inputValue]);

  const createLoadOptions = (referenceObjectCode: string) => {
    return async (inputValue: string) => {
      if (!inputValue) return [];

      const filters = [{
        operator: "AND",
        filter_item: {
          name: {
            operator: "contains",
            value: inputValue
          }
        }
      }];

      await fetchData(1, referenceObjectCode, filters);
      const data = referenceResponseData?.[referenceObjectCode];

      return (data?.items || []).map((item: any) => ({
        label: item["name"]?.value,
        value: item["serial"]?.value,
      }));
    };
  };

  return (
    <Card key={index} className="rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.2)] pt-0 pb-2">
      <CardContent className="p-0 pb-0 overflow-x-auto">
        {isLoading && (
          <div className="absolute top-0 left-0 w-full h-full bg-white/60 flex items-center justify-center z-10">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}

        <div className="flex justify-end gap-0 mb-2">
          <button
            className="cursor-pointer flex items-center gap-2 m-2 bg-gray-100 text-gray px-4 py-2 rounded-lg hover:bg-gray-200 transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
            onClick={() => {
              window.history.back()
            }}
          >
            <X size={18} />
            Cancel
          </button>
          <button
            className="cursor-pointer flex items-center gap-2 m-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-800 transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
            onClick={() => {
              console.log("save")
            }}
          >
            <Save size={18} />
            Save
          </button>
        </div>

        {/* The SidebarPanel */}
        <SidebarPanel isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
          <div className="space-x-2 flex items-center justify-end">

          </div>
        </SidebarPanel>

        {/* main content section starts */}
        <Card key={index} className="rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.2)] pt-0 m-2">
          <CardContent className="p-4 overflow-x-auto">
            <form className="space-y-4">
              {localViewComponent?.props?.fields
                ?.filter((field: any) => {
                  const isMetadata = metadataColumnList.includes(field.field_code);
                  const hasDoubleUnderscore = field.field_code.includes("__");
                  return !isMetadata && !hasDoubleUnderscore;
                })
                .map((field: any, idx: number) => {
                  const hasForeignRef = field.foreign_table_name && field.foreign_field_name;
                  const fieldCode = field.field_code;
                  const fieldLabel = field.field_name || toLabel(fieldCode);

                  let fieldValue = localResponseData?.[fieldCode]?.value;
                  const fieldType = field.data_type || "text";
                  const isBoolean = fieldType === "Bool";

                  const foreignOptions = hasForeignRef
                    ? referenceResponseData?.[field.foreign_table_name] || []
                    : [];

                  let inputType = "text";
                  if (fieldType === "Date") inputType = "date";
                  else if (fieldType === "DateTime" || fieldType === "Timestamptz") inputType = "datetime-local";
                  else if (fieldType === "Number") inputType = "number";

                  if (inputType === "date") {
                    if (typeof fieldValue === "string" && fieldValue.trim() !== "") {
                      const dateValue = new Date(fieldValue);
                      if (!isNaN(dateValue.getTime())) {
                        const formattedDate = dateValue.toISOString().split("T")[0];
                        fieldValue = formattedDate;
                      }
                    }
                  }

                  const defaultOptions = foreignOptions?.items?.map((item: any) => ({
                    label: item["name"]?.value,
                    value: item["serial"]?.value,
                  })) || [];

                  return (
                    <div key={idx} className="flex flex-col">
                      <label className="text-sm font-semibold text-gray-700 mb-1">
                        {fieldLabel}
                      </label>

                      {hasForeignRef ? (
                        <AsyncSelect
                          defaultOptions={defaultOptions}
                          value={fieldValue}
                          name={fieldCode}
                          inputValue={inputValue?.[fieldCode]}
                          menuPortalTarget={document.body}
                          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                          isClearable={true}
                          isSearchable={true}
                          onChange={(selected) => {
                            // handle selected item
                            setLocalResponseData((prevData) => ({
                              ...prevData,
                              [fieldCode]: {
                                ...localResponseData[fieldCode],
                                value: selected.value,
                                display_value: selected.label
                              },
                            }))
                          }}
                          onInputChange={(newValue: string) => {
                            setInputValue((prevData) => ({
                              ...prevData,
                              [fieldCode]: newValue,
                            }))
                          }}
                        />
                      ) : isBoolean ? (
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name={fieldCode}
                            checked={Boolean(fieldValue)}
                            className="sr-only peer"
                            onChange={(e) => {
                              // handle change event here
                              setLocalResponseData((prevData) => ({
                                ...prevData,
                                [fieldCode]: {
                                  ...localResponseData[fieldCode],
                                  value: e.target.checked,
                                  display_value: e.target.checked
                                },
                              }))
                            }}
                          />
                          <div className="w-16 h-9 bg-gray-300 rounded-full peer peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-0.5 after:left-[-2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-8 after:w-8 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white relative" />
                        </label>
                      ) : (
                        <input
                          type={inputType}
                          name={fieldCode}
                          defaultValue={fieldValue}
                          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          onChange={(e) => {
                            setLocalResponseData((prevData) => ({
                              ...prevData,
                              [fieldCode]: {
                                ...localResponseData[fieldCode],
                                value: e.target.value,
                                display_value: e.target.value
                              },
                            }))
                          }}
                        />
                      )}
                    </div>
                  );
                })}
            </form>
          </CardContent>
        </Card>
        {/* main content section ends */}

        <div className="flex justify-end gap-0 mt-2">
          <button
            className="cursor-pointer flex items-center gap-2 m-2 bg-gray-100 text-gray px-4 py-2 rounded-lg hover:bg-gray-200 transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
            onClick={() => {
              window.history.back()
            }}
          >
            <X size={18} />
            Cancel
          </button>
          <button
            className="cursor-pointer flex items-center gap-2 m-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-800 transition shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
            onClick={() => {
              console.log("save")
            }}
          >
            <Save size={18} />
            Save
          </button>
        </div>
      </CardContent>
    </Card>
  )
}