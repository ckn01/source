package entity

type FilterGroupOperator string
type FilterOperator string

const (
	PUBLIC             = "public"
	PRODUCT_CODE       = "product_code"
	TENANT_CODE        = "tenant_code"
	OBJECT_CODE        = "object_code"
	VIEW_SCHEMA_SERIAL = "view_schema_serial"
	VIEW_LAYOUT_SERIAL = "view_layout_serial"

	FilterOperatorAnd FilterGroupOperator = "AND"
	FilterOperatorOr  FilterGroupOperator = "OR"

	FilterOperatorEqual            FilterOperator = "equal"
	FilterOperatorNotEqual         FilterOperator = "not_equal"
	FilterOperatorContains         FilterOperator = "contains"
	FilterOperatorNotContains      FilterOperator = "not_contains"
	FilterOperatorGreaterThan      FilterOperator = "greater_than"
	FilterOperatorGreaterThanEqual FilterOperator = "greater_than_equal"
	FilterOperatorLessThan         FilterOperator = "less_than"
	FilterOperatorLessThanEqual    FilterOperator = "less_than_equal"

	FieldColumnName            = "field_name"
	FieldDataType              = "data_type"
	FieldColumnCode            = "field_code"
	FieldForeignTableName      = "foreign_table_name"
	FieldForeignColumnName     = "foreign_field_name"
	FieldCompleteColumnCode    = "complete_field_code"
	FieldOriginalFieldCode     = "original_field_code"
	ForeignTable               = "foreign_table"
	ForeignReferenceColumnName = "foreign_reference_column_name"
)

var (
	OperatorQueryMap = map[FilterOperator]string{
		FilterOperatorEqual:            "=",
		FilterOperatorNotEqual:         "!=",
		FilterOperatorContains:         "ILIKE",
		FilterOperatorNotContains:      "NOT ILIKE",
		FilterOperatorGreaterThan:      ">",
		FilterOperatorGreaterThanEqual: ">=",
		FilterOperatorLessThan:         "<",
		FilterOperatorLessThanEqual:    "<=",
	}

	OperatorLIKEList = []FilterOperator{
		FilterOperatorContains,
		FilterOperatorNotContains,
	}
)

type Tenants struct {
	ID     int32  `json:"id"`
	Serial string `json:"serial"`
	Code   string `json:"code"`
	Name   string `json:"name"`
}

type DataSource struct {
	ID          int                    `json:"id"`
	Serial      string                 `json:"serial"`
	Code        string                 `json:"code"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Host        string                 `json:"host"`
	Port        string                 `json:"port"`
	Username    string                 `json:"username"`
	Password    string                 `json:"password"`
	DBName      string                 `json:"db_name"`
	Configs     map[string]interface{} `json:"configs"`
	Tenant      Tenants                `json:"tenant"`
}

type Modules struct {
	ID                 int    `json:"id"`
	Serial             string `json:"serial"`
	Code               string `json:"code"`
	Name               string `json:"name"`
	ParentModuleSerial string `json:"parent_module_serial"`
	Version            string `json:"version"`
}

type Products struct {
	ID      int    `json:"id"`
	Serial  string `json:"serial"`
	Code    string `json:"code"`
	Name    string `json:"name"`
	IconURL string `json:"icon_url"`
}

type Objects struct {
	ID          int        `json:"id"`
	Serial      string     `json:"serial"`
	Tenant      Tenants    `json:"tenant"`
	Module      Modules    `json:"module"`
	Code        string     `json:"code"`
	DisplayName string     `json:"display_name"`
	Description string     `json:"description"`
	ObjectType  string     `json:"object_type"`
	DataSource  DataSource `json:"data_source"`
}

type ObjectFields struct {
	ID                int                    `json:"id"`
	Serial            string                 `json:"serial"`
	Object            Objects                `json:"object"`
	FieldCode         string                 `json:"field_code"`
	IsDisplayName     bool                   `json:"is_display_name"`
	DisplayName       string                 `json:"display_name"`
	FieldReference    string                 `json:"field_reference"`
	Description       string                 `json:"description"`
	DataType          DataType               `json:"data_type"`
	ValidationRules   map[string]interface{} `json:"validation_rules"`
	TargetObject      Objects                `json:"target_object"`
	TargetObjectField map[string]interface{} `json:"target_object_field"`
	Relation          string                 `json:"relation"`
	IsSystem          bool                   `json:"is_system"`
	DefaultValue      string                 `json:"default_value"`
}

type DataType struct {
	ID                int                    `json:"id"`
	Serial            string                 `json:"serial"`
	Code              string                 `json:"code"`
	Name              string                 `json:"name"`
	Description       string                 `json:"description"`
	PrimitiveDataType string                 `json:"primitive_data_type"`
	ValidationRules   map[string]interface{} `json:"validation_rules"`
	IsActive          bool                   `json:"is_active"`
	DisplayType       string                 `json:"display_type"`
	FieldOptions      map[string]interface{} `json:"field_options"`
	Icon              string                 `json:"icon"`
}

type FilterItem struct {
	FieldName string         `json:"field_name"`
	Operator  FilterOperator `json:"operator"`
	Value     any            `json:"value"`
}

type FilterGroup struct {
	Operator FilterOperator        `json:"operator"`
	Filters  map[string]FilterItem `json:"filter_item"`
}

type Order struct {
	FieldName string `json:"field_name"`
	Direction string `json:"direction"`
}

type Field struct {
	FieldCode string `json:"field_code"`
	FieldName string `json:"field_name"`
}

type CatalogQuery struct {
	Fields          map[string]Field `json:"fields"`
	Filters         []FilterGroup    `json:"filters"`
	Orders          []Order          `json:"orders"`
	Page            int              `json:"page"`
	PageSize        int              `json:"page_size"`
	Serial          string           `json:"serial"`
	ObjectCode      string           `json:"object_code"`
	ObjectSerial    string           `json:"object_serial"`
	TenantCode      string           `json:"tenant_code"`
	TenantSerial    string           `json:"tenant_serial"`
	ProductCode     string           `json:"product_code"`
	ProductSerial   string           `json:"product_serial"`
	RawQuery        string           `json:"raw_query"`
	ViewContentCode string           `json:"view_content_code"`
}

type DataItem struct {
	CompleteFieldCode string      `json:"complete_field_code"`
	FieldCode         string      `json:"field_code"`
	FieldName         string      `json:"field_name"`
	DataType          string      `json:"data_type"`
	Value             interface{} `json:"value"`
	DisplayValue      interface{} `json:"display_value"`
}

type CatalogResponse struct {
	Page      int                   `json:"page"`
	PageSize  int                   `json:"page_size"`
	TotalData int                   `json:"total_data"`
	TotalPage int                   `json:"total_page"`
	Items     []map[string]DataItem `json:"items"`
}

type DataMutationRequest struct {
	Serial      string     `json:"serial"`
	Items       []DataItem `json:"items"`
	ObjectCode  string     `json:"object_code"`
	TenantCode  string     `json:"tenant_code"`
	ProductCode string     `json:"product_code"`
	UserSerial  string     `json:"user_serial"`
}

type ForeignKeyInfo struct {
	ForeignSchema string `json:"foreign_schema"`
	ForeignTable  string `json:"foreign_table"`
	ForeignColumn string `json:"foreign_column"`
}
