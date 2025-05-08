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

type GetNavigationItemByViewContentSerialRequest struct {
	ViewContentSerial string `json:"view_content_serial"`
}

type Navigation struct {
	Serial           string         `json:"serial"`
	ViewContent      ViewContent    `json:"view_content"`
	Code             string         `json:"code"`
	Title            string         `json:"title"`
	Description      string         `json:"description"`
	URL              string         `json:"url"`
	NavigationLevel  int32          `json:"navigation_level"`
	Path             string         `json:"path"`
	ParentCode       string         `json:"parent_code"`
	RootCode         string         `json:"root_code"`
	NavigationOrder  int32          `json:"navigation_order"`
	NavigationConfig map[string]any `json:"navigation_config"`
}

func (nav *Navigation) ConvertFlatNavigationToMap() map[string]any {
	item := map[string]any{
		"serial":            nav.Serial,
		"view_content":      nav.ViewContent,
		"code":              nav.Code,
		"title":             nav.Title,
		"description":       nav.Description,
		"url":               nav.URL,
		"navigation_level":  nav.NavigationLevel,
		"path":              nav.Path,
		"parent_code":       nav.ParentCode,
		"root_code":         nav.RootCode,
		"navigation_order":  nav.NavigationOrder,
		"navigation_config": nav.NavigationConfig,
		"children":          []map[string]any{}, // prefill if you're going to use it for tree building
	}

	return item
}

func ConvertFlatNavigationToMapList(flat []Navigation) []map[string]any {
	var result []map[string]any

	for _, nav := range flat {
		result = append(result, nav.ConvertFlatNavigationToMap())
	}

	return result
}
