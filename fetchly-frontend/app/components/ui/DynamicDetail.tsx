import { CheckCircle, XCircle } from "lucide-react";

interface DynamicDetailProps {
  viewComponent: {
    props?: {
      fields?: any[];
      is_displaying_metadata_column?: boolean;
    };
  };
  viewLayout: any;
  responseData: any;
}

export default function DynamicDetail({
  viewComponent,
  viewLayout,
  responseData,
}: DynamicDetailProps) {
  const fields = viewComponent.props?.fields || [];
  const is_displaying_metadata_column = viewComponent.props?.is_displaying_metadata_column;

  const metadataColumnList = [
    "created_at",
    "created_by",
    "deleted_at",
    "deleted_by",
    "updated_at",
    "updated_by",
    "serial",
    "id"
  ];

  return (
    <div className="space-y-4">
      {fields
        .filter(field => is_displaying_metadata_column || !metadataColumnList.includes(field.field_code))
        .sort((a, b) => a.field_order - b.field_order)
        .map((field) => {
          const fieldCode = field.field_code.split('.')[0];
          const itemField = responseData?.[fieldCode];

          // Handle custom render config if available
          let displayValue = itemField?.display_value;
          if (field.render_config) {
            try {
              displayValue = field.render_config.replace(/\${([^}]+)}/g, (_match: string, fieldName: string) => {
                const value = responseData[fieldName]?.display_value || '';
                return value;
              });
            } catch (error) {
              console.error('Error processing render config:', error);
            }
          } else if (field.data_type === 'Bool') {
            displayValue = itemField?.value ? (
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
            <div key={field.field_code} className="grid grid-cols-3 gap-4 items-start">
              <div className="text-md font-medium text-gray-500">
                {field.field_name}
              </div>
              <div className="col-span-2 text-md text-gray-900">
                {displayValue || '-'}
              </div>
            </div>
          );
        })}
    </div>
  );
} 