import { dashboardConfig } from "@/app/appConfig";
import { Card, CardContent } from "@/components/ui/card";
import { toLabel } from "@/lib/utils";
import { Save, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import SidebarPanel from "../SidebarPanel";

interface DynamicFormProps {
  index: number;
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

export default function DynamicForm({ index, viewLayout, responseData }: DynamicFormProps) {
  const params = useParams<RouteParams>();
  const {
    tenantCode = dashboardConfig.defaultTenantCode,
    productCode = dashboardConfig.defaultProductCode,
    objectCode = dashboardConfig.defaultObjectCode,
    viewContentCode = dashboardConfig.defaultViewContentCode,
  } = params;
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    if (tenantCode && productCode && objectCode && viewContentCode) {

    }
  }, [tenantCode, productCode, objectCode, viewContentCode]);

  return (
    <Card key={index} className="rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.2)] pt-0 pb-2">
      <CardContent className="p-0 pb-0 overflow-x-auto">
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
              {viewLayout?.children?.[0]?.props?.fields
                ?.filter((field: any) => {
                  const isMetadata = metadataColumnList.includes(field.field_code);
                  const hasDoubleUnderscore = field.field_code.includes("__");
                  return !isMetadata && !hasDoubleUnderscore;
                })
                .map((field: any, idx: number) => {
                  const fieldCode = field.field_code;
                  const fieldLabel = field.field_name || toLabel(fieldCode);
                  const fieldValue = responseData?.data?.[fieldCode] ?? "";
                  const fieldType = field.data_type || "text";

                  let inputType = "text";
                  if (fieldType === "Date") inputType = "date";
                  else if (fieldType === "Number") inputType = "number";

                  const isBoolean = fieldType === "Bool";

                  return (
                    <div key={idx} className="flex flex-col">
                      <label className="text-sm font-semibold text-gray-700 mb-1">
                        {fieldLabel}
                      </label>

                      {isBoolean ? (
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name={fieldCode}
                            defaultChecked={Boolean(fieldValue)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white relative" />
                        </label>
                      ) : (
                        <input
                          type={inputType}
                          name={fieldCode}
                          defaultValue={fieldValue}
                          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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