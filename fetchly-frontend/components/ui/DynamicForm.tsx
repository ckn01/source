import { APIMethod, dashboardConfig } from "@/app/appConfig";
import { Card, CardContent } from "@/components/ui/card";
import { toLabel } from "@/lib/utils";
import { Save, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import SidebarPanel from "../SidebarPanel";
import FancyAlert from "./Alert";

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

export default function DynamicForm({ index, viewComponent, responseData }: DynamicFormProps) {
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
  const [inputValue, setInputValue] = useState<Record<string, string | undefined>>({});
  const [localResponseData, setLocalResponseData] = useState<Record<string, any>>(responseData);
  const [localViewComponent] = useState<any>(viewComponent)
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState<Record<string, any>>({
    "title": null,
    "content": "Alert content",
    "position": "top-right",
    "type": "success",
    "autoDismiss": true
  });

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

      setIsLoading(false)
    } catch (error) {
      console.error("Data API error:", error);
    }
  };

  useEffect(() => {
    if (tenantCode && productCode && objectCode && viewContentCode && localViewComponent) {
      localViewComponent.props?.fields?.map((field: { foreign_table_name: "", foreign_field_name: "" }) => {
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
    } else {
      // set default value for each field
      const defaultData: Record<string, any> = {};
      localViewComponent?.props?.fields?.forEach((field: any) => {
        const fieldCode = field.field_code;
        defaultData[fieldCode] = {
          value: "",
          display_value: "",
        };
      });

      setLocalResponseData(defaultData);
      setInputValue(defaultData);
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

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      let url = `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}/o/${objectCode}/data`;
      let method = APIMethod.PUT

      const serialValue = localResponseData?.serial?.value;
      if (serialValue != null && serialValue !== '') {
        url = `${url}/${serialValue}`;
        method = APIMethod.PATCH
      }

      const fieldArray = Object.entries(localResponseData)
        .filter(([key, field]) => !key.includes('__') && field.value !== '') // skip if key contains "__" or value is empty
        .map(([field_code, field]) => ({
          field_code,
          ...field
        }));


      const dataResponse = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serial: serialValue,
          items: fieldArray,
          object_code: objectCode,
          tenant_code: tenantCode,
          product_code: productCode,
          view_content_code: viewContentCode,
        }),
      });

      if (!dataResponse.ok) {
        throw new Error("Failed to submit data");
      }

      const data = await dataResponse.json();

      // Check for 200 and redirect
      if (dataResponse.status === 200) {
        setAlertMessage((prev) => {
          const updated = { ...prev[0] };
          updated.title = "Success to submit data";
          updated.content = "You will be redirected in 3 seconds...";
          updated.type = "success";

          return updated;
        })

        setTimeout(() => {
          const redirectUrl = `/${tenantCode}/${productCode}/${objectCode}/${viewContentCode}`;
          window.location.href = redirectUrl;
        }, 3000);

      } else {
        setAlertMessage((prev) => {
          const updated = { ...prev[0] };
          updated.title = "Failed to submit data";
          updated.content = dataResponse.status;
          updated.type = "danger";

          return updated;
        })
      }

    } catch (error) {
      console.error("Data API error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    console.log("alertMessage", alertMessage)
    if (alertMessage.title !== null && alertMessage.title !== "") {
      setShowAlert(true)
    }
  }, [alertMessage])

  return (
    <Card key={index} className="rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.2)] pt-0 pb-2">
      {showAlert && (
        <FancyAlert
          title={alertMessage.title}
          message={alertMessage.content}
          position={alertMessage.position}
          autoDismiss={alertMessage.autoDismiss}
          type={alertMessage.type}
          onClose={() => setShowAlert(false)}
        />
      )}

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
              handleSubmit()
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
                          value={defaultOptions.find((opt: { value: any; }) => opt.value === fieldValue) ?? null}
                          name={fieldCode}
                          inputValue={inputValue?.[fieldCode]}
                          menuPortalTarget={document.body}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            control: (base) => ({
                              ...base,
                              padding: '4px 4px',
                              borderRadius: '1rem',
                              borderColor: "#9ca3af",
                              minHeight: '48px',
                              fontSize: '14px',
                            }),
                          }}
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
                          <div className="
                            w-16 
                            h-9 
                            bg-gray-400 
                            rounded-full 
                            peer 
                            peer-checked:bg-cyan-500 
                            after:content-[''] 
                            after:absolute 
                            after:top-0.5 
                            after:left-[-2px] 
                            after:bg-white 
                            after:border-gray-300 
                            after:border 
                            after:rounded-full 
                            after:h-8 
                            after:w-8 
                            after:transition-all 
                            peer-checked:after:translate-x-full 
                            peer-checked:after:border-white 
                            relative
                          " />
                        </label>
                      ) : (
                        <input
                          type={inputType}
                          name={fieldCode}
                          defaultValue={fieldValue}
                          className="border border-gray-400 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
              handleSubmit()
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