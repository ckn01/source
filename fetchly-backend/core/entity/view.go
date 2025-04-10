package entity

const (
	PROPS      = "props"
	FIELDS     = "fields"
	CLASS_NAME = "class_name"
)

type GetViewContentByKeysRequest struct {
	TenantCode      string `json:"tenant_code"`
	ProductCode     string `json:"product_code"`
	ObjectCode      string `json:"object_code"`
	ViewContentCode string `json:"view_content_code"`
	LayoutType      string `json:"layout_type"`
}

type ViewLayout struct {
	Serial       string         `json:"serial"`
	Code         string         `json:"code"`
	LayoutConfig map[string]any `json:"layout_config"`
}

type ViewSchema struct {
	Serial        string         `json:"serial"`
	Code          string         `json:"code"`
	Name          string         `json:"name"`
	Query         map[string]any `json:"query"`
	DisplayField  map[string]any `json:"display_field"`
	StructureType string         `json:"structure_type"`
	ActionSerial  string         `json:"action_serial"`
	IsFavorite    bool           `json:"is_favorite"`
	ObjectSerial  string         `json:"object_serial"`
	FieldSections map[string]any `json:"field_sections"`
}

type ViewContentResponse struct {
	ViewContent ViewContent      `json:"view_content"`
	Fields      []map[string]any `json:"fields"`
	Layout      map[string]any   `json:"layout"`
}

type ViewContent struct {
	Serial        string     `json:"serial"`
	Code          string     `json:"code"`
	Name          string     `json:"name"`
	Tenant        Tenants    `json:"tenant"`
	Product       Products   `json:"product"`
	Object        Objects    `json:"object"`
	OwnerSerial   string     `json:"owner_serial"`
	ViewLayout    ViewLayout `json:"view_layout"`
	ViewSchema    ViewSchema `json:"view_schema"`
	LayoutType    string     `json:"layout_type"`
	IsDefault     bool       `json:"is_default"`
	IsShownInList bool       `json:"is_shown_in_list"`
}
