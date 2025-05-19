package module

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
	"sort"
	"strings"

	"github.com/fetchlydev/source/fetchly-backend/config"
	"github.com/fetchlydev/source/fetchly-backend/core/entity"
	"github.com/fetchlydev/source/fetchly-backend/core/repository"
	"github.com/fetchlydev/source/fetchly-backend/pkg/helper"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

type ViewUsecase interface {
	GetContentLayoutByKeys(ctx context.Context, request entity.GetViewContentByKeysRequest, catalogQuery entity.CatalogQuery) (resp entity.ViewContentResponse, err error)
	GetNavigationByViewContentSerial(ctx context.Context, request entity.GetNavigationItemByViewContentSerialRequest) (resp []entity.Navigation, treeResp []map[string]any, err error)
}

type viewUsecase struct {
	cfg         config.Config
	catalogRepo repository.CatalogRepository
	viewRepo    repository.ViewRepository
	catalogUc   CatalogUsecase
}

func NewViewUsecase(cfg config.Config, catalogRepo repository.CatalogRepository, viewRepo repository.ViewRepository, catalogUc CatalogUsecase) ViewUsecase {
	return &viewUsecase{
		cfg:         cfg,
		catalogRepo: catalogRepo,
		viewRepo:    viewRepo,
		catalogUc:   catalogUc,
	}
}

func (uc *viewUsecase) GetNavigationByViewContentSerial(ctx context.Context, request entity.GetNavigationItemByViewContentSerialRequest) (resp []entity.Navigation, treeResp []map[string]any, err error) {
	resp, err = uc.viewRepo.GetNavigationByViewContentSerial(ctx, request)
	if err != nil {
		return resp, treeResp, err
	}

	// Sort flat list by navigation_order
	sort.Slice(resp, func(i, j int) bool {
		return resp[i].NavigationOrder < resp[j].NavigationOrder
	})

	// Get parent path and root path
	for i, val := range resp {
		pathParts := strings.Split(val.Path, ".")

		resp[i].RootCode = pathParts[0]
		resp[i].ParentCode = strings.Join(pathParts[:len(pathParts)-1], ".")
	}

	// Initialize tree map
	treeMap := make(map[string]map[string]any)

	for _, nav := range resp {
		// Create node
		node := map[string]any{
			"serial":            nav.Serial,
			"view_content":      nav.ViewContent,
			"code":              nav.Code,
			"title":             nav.Title,
			"description":       nav.Description,
			"url":               nav.URL,
			"navigation_level":  nav.NavigationLevel,
			"navigation_order":  nav.NavigationOrder,
			"navigation_config": nav.NavigationConfig,
			"path":              nav.Path,
			"parent_code":       nav.ParentCode,
			"root_code":         nav.RootCode,
			"children":          []map[string]any{},
		}

		treeMap[nav.Code] = node
	}

	// Build tree structure
	var roots []map[string]any

	for _, nav := range resp {
		node := treeMap[nav.Code]
		if parent, ok := treeMap[nav.ParentCode]; ok && nav.ParentCode != "" {
			children := parent["children"].([]map[string]any)
			parent["children"] = append(children, node)
		} else {
			roots = append(roots, node)
		}
	}

	// Recursive sort of children by navigation_order
	var sortChildrenByOrder func(map[string]any)
	sortChildrenByOrder = func(node map[string]any) {
		children, ok := node["children"].([]map[string]any)
		if !ok || len(children) == 0 {
			return
		}

		sort.Slice(children, func(i, j int) bool {
			return children[i]["navigation_order"].(int32) < children[j]["navigation_order"].(int32)
		})

		node["children"] = children

		for _, child := range children {
			sortChildrenByOrder(child)
		}
	}

	for _, root := range roots {
		sortChildrenByOrder(root)
	}

	treeResp = roots
	return resp, treeResp, nil
}

func (uc *viewUsecase) GetContentLayoutByKeys(ctx context.Context, request entity.GetViewContentByKeysRequest, catalogQuery entity.CatalogQuery) (resp entity.ViewContentResponse, err error) {
	viewContentRecord, err := uc.viewRepo.GetViewContentByKeys(ctx, request)
	if err != nil {
		return resp, err
	}

	// Convert map to struct
	if err = mapToStructSnakeCase(viewContentRecord, &resp.ViewContent); err != nil {
		return resp, err
	}

	// tenant record
	if viewContentRecord[entity.TENANT_CODE].Value != nil || request.TenantCode != "" {
		tenantSt := entity.Tenants{}

		tenantCode := viewContentRecord[entity.TENANT_CODE].Value
		if tenantCode == nil {
			tenantCode = request.TenantCode
		}

		if tenantCode != "" {
			tenantRecord, err := uc.catalogRepo.GetObjectDetail(ctx, entity.CatalogQuery{
				Serial:     tenantCode.(string),
				ObjectCode: "tenants",
				TenantCode: entity.PUBLIC,
			})
			if err != nil {
				return resp, err
			}

			if err = mapToStructSnakeCase(tenantRecord, &tenantSt); err != nil {
				return resp, err
			}

			resp.ViewContent.Tenant = tenantSt
		}

	}

	// object record
	if viewContentRecord[entity.OBJECT_CODE].Value != nil || request.ObjectCode != "" {
		objectSt := entity.Objects{}

		objectCode := viewContentRecord[entity.OBJECT_CODE].Value
		if objectCode == nil {
			objectCode = request.ObjectCode
		}

		if objectCode != "" {
			objectRecord, err := uc.catalogRepo.GetObjectDetail(ctx, entity.CatalogQuery{
				Serial:     objectCode.(string),
				ObjectCode: "objects",
				TenantCode: entity.PUBLIC,
			})
			if err != nil {
				return resp, err
			}

			if err = mapToStructSnakeCase(objectRecord, &objectSt); err != nil {
				return resp, err
			}

			resp.ViewContent.Object = objectSt
		}
	}

	// product
	if viewContentRecord[entity.PRODUCT_CODE].Value != nil || request.ProductCode != "" {
		productSt := entity.Products{}

		productCode := viewContentRecord[entity.PRODUCT_CODE].Value
		if productCode == nil {
			productCode = request.ProductCode
		}

		if productCode != "" {
			objectRecord, err := uc.catalogRepo.GetObjectDetail(ctx, entity.CatalogQuery{
				Serial:     productCode.(string),
				ObjectCode: "products",
				TenantCode: entity.PUBLIC,
			})
			if err != nil {
				return resp, err
			}

			if err = mapToStructSnakeCase(objectRecord, &productSt); err != nil {
				return resp, err
			}

			resp.ViewContent.Product = productSt
		}
	}

	// view schema
	if viewContentRecord[entity.VIEW_SCHEMA_SERIAL].Value != nil {
		viewSchemaSt := entity.ViewSchema{}

		if ok := viewContentRecord[entity.VIEW_SCHEMA_SERIAL].Value.(string); ok != "" {
			objectRecord, err := uc.catalogRepo.GetObjectDetail(ctx, entity.CatalogQuery{
				Serial:     viewContentRecord[entity.VIEW_SCHEMA_SERIAL].Value.(string),
				ObjectCode: "view_schema",
				TenantCode: entity.PUBLIC,
			})
			if err != nil {
				return resp, err
			}

			if err = mapToStructSnakeCase(objectRecord, &viewSchemaSt); err != nil {
				return resp, err
			}

			resp.ViewContent.ViewSchema = viewSchemaSt

			if catalogQuery.Fields == nil {
				catalogQuery.Fields = make(map[string]entity.Field)
			}

			// inject viewSchema fields into request
			viewSchemaFields := viewSchemaSt.DisplayField
			if len(viewSchemaFields) > 0 {
				for key, item := range viewSchemaFields {
					// convert item to entity.Field
					field := entity.Field{}

					if _, ok := item.(map[string]any); !ok {
						continue
					}

					item := item.(map[string]any)

					if fieldCode, ok := item["field_code"].(string); ok {
						field.FieldCode = fieldCode
					}
					if fieldName, ok := item["field_name"].(string); ok {
						field.FieldName = fieldName
					}

					catalogQuery.Fields[key] = field
				}
			}
		}
	}

	// view layout
	if viewContentRecord[entity.VIEW_LAYOUT_SERIAL].Value != nil {
		viewLayoutSt := entity.ViewLayout{}

		if ok := viewContentRecord[entity.VIEW_LAYOUT_SERIAL].Value.(string); ok != "" {
			objectRecord, err := uc.catalogRepo.GetObjectDetail(ctx, entity.CatalogQuery{
				Serial:     viewContentRecord[entity.VIEW_LAYOUT_SERIAL].Value.(string),
				ObjectCode: "view_layout",
				TenantCode: entity.PUBLIC,
			})
			if err != nil {
				return resp, err
			}

			if err = mapToStructSnakeCase(objectRecord, &viewLayoutSt); err != nil {
				return resp, err
			}

			resp.ViewContent.ViewLayout = viewLayoutSt
		}
	}

	// get original fields
	if catalogQuery.ObjectSerial == "" {
		catalogQuery = entity.CatalogQuery{
			ObjectCode:   request.ObjectCode,
			ObjectSerial: resp.ViewContent.Object.Serial,
			TenantCode:   request.TenantCode,
			TenantSerial: resp.ViewContent.Tenant.Serial,
			ProductCode:  request.ProductCode,
			Fields:       catalogQuery.Fields,
		}
	}

	injectedFields := []map[string]any{}

	switch resp.ViewContent.LayoutType {
	case "record", "detail", "form":
		catalogQuery.IsForLayout = true
		originalFields, _, _, _, err := uc.catalogRepo.GetColumnList(ctx, catalogQuery)
		if err != nil {
			return resp, err
		}

		// handle custom object fields based on object field table
		objectFields := map[string]any{}
		if catalogQuery.ObjectSerial != "" {
			objectFields, err = uc.catalogUc.GetObjectFieldsByObjectCode(ctx, catalogQuery)
			if err != nil {
				return resp, err
			}
		}

		for i, originalField := range originalFields {
			fieldCode := originalField[entity.FieldColumnCode].(string)

			if field, ok := objectFields[fieldCode]; ok {
				data, ok := field.(entity.ObjectFields)
				if !ok {
					continue
				}

				originalField[entity.FieldDataType] = data.DataType.Code
				originalField[entity.FieldColumnName] = data.DisplayName
			}

			//  camel case field name
			originalField[entity.FieldColumnName] = strings.ReplaceAll(cases.Title(language.English).String(originalField[entity.FieldColumnName].(string)), "_", " ")
			originalField[entity.FieldDataType] = cases.Title(language.English).String(originalField[entity.FieldDataType].(string))

			originalFields[i] = originalField
		}

		resp.Fields = originalFields
		injectedFields = originalFields
	case "navigation":
		// Handle layout logic for navigation
		// get list of navigation item
		// inject into view content

		flatNavigation, treeNavigation, err := uc.GetNavigationByViewContentSerial(ctx, entity.GetNavigationItemByViewContentSerialRequest{
			ViewContentSerial: resp.ViewContent.Serial,
		})
		if err != nil {
			return resp, err
		}

		resp.Fields = entity.ConvertFlatNavigationToMapList(flatNavigation)
		injectedFields = treeNavigation
	}

	// fetching layout
	resp.Layout, err = handleViewLayout(resp.ViewContent.ViewLayout.LayoutConfig, injectedFields, request)
	if err != nil {
		return resp, err
	}

	return resp, nil
}

func handleViewLayout(viewLayoutConfig map[string]any, fields []map[string]any, request entity.GetViewContentByKeysRequest) (map[string]any, error) {
	// check if viewLayoutConfig is nil
	if viewLayoutConfig == nil {
		return nil, nil
	}

	// check if viewLayoutConfig is a map
	if reflect.TypeOf(viewLayoutConfig).Kind() != reflect.Map {
		return nil, fmt.Errorf("viewLayoutConfig is not a map")
	}

	componentType, ok := viewLayoutConfig["type"].(string)
	if !ok {
		return nil, fmt.Errorf("component type is not a string")
	}

	// Handle props if they exist
	props := map[string]any{}
	if propsVal, ok := viewLayoutConfig[entity.PROPS]; ok {
		if propsMap, ok := propsVal.(map[string]any); ok {
			props = propsMap
		}
	}

	// Handle className if it exists
	className := ""
	if classNameVal, ok := viewLayoutConfig[entity.CLASS_NAME]; ok {
		if classNameStr, ok := classNameVal.(string); ok {
			className = classNameStr
		}
	}

	switch componentType {
	case entity.TypeWebView, entity.TypeMobileView:
		// Handle children recursively
		if children, ok := viewLayoutConfig["children"].([]any); ok {
			for i, child := range children {
				if childMap, ok := child.(map[string]any); ok {
					childConfig, err := handleViewLayout(childMap, fields, request)
					if err != nil {
						return nil, err
					}
					children[i] = childConfig
				}
			}
			viewLayoutConfig["children"] = children
		}

	case entity.TypeGrid, entity.TypeGridItem, entity.TypeRow, entity.TypeColumn:
		// Handle grid system components
		if className == "" {
			viewLayoutConfig[entity.CLASS_NAME] = fmt.Sprintf("%s__%s", componentType, request.ObjectCode)
		}

		// Handle children recursively
		if children, ok := viewLayoutConfig["children"].([]any); ok {
			for i, child := range children {
				if childMap, ok := child.(map[string]any); ok {
					childConfig, err := handleViewLayout(childMap, fields, request)
					if err != nil {
						return nil, err
					}
					children[i] = childConfig
				}
			}
			viewLayoutConfig["children"] = children
		}

		// Validate grid props
		if componentType == entity.TypeGridItem {
			if props["xs"] != nil {
				xs, ok := props["xs"].(float64)
				if !ok || xs < 1 || xs > 12 {
					return nil, fmt.Errorf("invalid xs value: must be between 1 and 12")
				}
			}
			// Similar validation for sm, md, lg, xl
			for _, size := range []string{"sm", "md", "lg", "xl"} {
				if props[size] != nil {
					val, ok := props[size].(float64)
					if !ok || val < 1 || val > 12 {
						return nil, fmt.Errorf("invalid %s value: must be between 1 and 12", size)
					}
				}
			}
		}

	case entity.TypeScoreCard:
		if className == "" {
			viewLayoutConfig[entity.CLASS_NAME] = fmt.Sprintf("scorecard__%s", request.ObjectCode)
		}

		// Validate score card configuration
		if config, ok := props["config"].(map[string]any); ok {
			// Validate layout
			if layout, exists := config["layout"].(string); exists {
				if layout != entity.ScoreCardLayoutHorizontal && layout != entity.ScoreCardLayoutVertical {
					return nil, fmt.Errorf("invalid score card layout: %s", layout)
				}
			}

			// Validate cards
			if cards, exists := config["cards"].([]any); exists {
				for _, card := range cards {
					if cardMap, ok := card.(map[string]any); ok {
						// Validate required fields
						if _, hasTitle := cardMap["title"].(string); !hasTitle {
							return nil, fmt.Errorf("score card must have a title")
						}
						if _, hasValue := cardMap["value"].(string); !hasValue {
							return nil, fmt.Errorf("score card must have a value")
						}

						// Validate trend if exists
						if trend, hasTrend := cardMap["trend"].(map[string]any); hasTrend {
							if trendType, ok := trend["type"].(string); ok {
								validTrendTypes := map[string]bool{
									entity.ScoreCardTrendIncrease: true,
									entity.ScoreCardTrendDecrease: true,
									entity.ScoreCardTrendNeutral:  true,
								}
								if !validTrendTypes[trendType] {
									return nil, fmt.Errorf("invalid trend type: %s", trendType)
								}
							}
						}

						// Validate data source if exists
						if ds, hasDS := cardMap["dataSource"].(map[string]any); hasDS {
							if dsType, ok := ds["type"].(string); ok {
								switch dsType {
								case entity.DataSourceTypeAPI, entity.DataSourceTypeStatic, entity.DataSourceTypeQuery:
									// Valid data source type
								default:
									return nil, fmt.Errorf("invalid data source type: %s", dsType)
								}
							}
						}
					}
				}
			}
		}

	case entity.TypeChart:
		if className == "" {
			viewLayoutConfig[entity.CLASS_NAME] = fmt.Sprintf("chart__%s", request.ObjectCode)
		}

		// Validate chart configuration
		if subType, ok := viewLayoutConfig["subType"].(string); ok {
			validChartTypes := map[string]bool{
				entity.ChartTypeLine:    true,
				entity.ChartTypeBar:     true,
				entity.ChartTypePie:     true,
				entity.ChartTypeArea:    true,
				entity.ChartTypeScatter: true,
				entity.ChartTypeRadar:   true,
			}
			if !validChartTypes[subType] {
				return nil, fmt.Errorf("invalid chart subType: %s", subType)
			}
		}

		// Handle chart data source
		if dataSource, ok := props["dataSource"].(map[string]any); ok {
			if dsType, ok := dataSource["type"].(string); ok {
				switch dsType {
				case entity.DataSourceTypeAPI, entity.DataSourceTypeStatic, entity.DataSourceTypeQuery:
					// Valid data source type
				default:
					return nil, fmt.Errorf("invalid data source type: %s", dsType)
				}
			}
		}

	case entity.TypeTable, entity.TypeDetail, entity.TypeForm, entity.TypeNavigation:
		// Handle standard components
		if className == "" {
			viewLayoutConfig[entity.CLASS_NAME] = fmt.Sprintf("%s__%s", componentType, request.ObjectCode)
		}

		isInjectProps := false
		if objCode, exists := props[entity.OBJECT_CODE]; !exists || objCode.(string) == "" || objCode.(string) == request.ObjectCode {
			isInjectProps = true
		}

		if isInjectProps {
			props[entity.FIELDS] = fields
			props[entity.OBJECT_CODE] = request.ObjectCode
			props[entity.TENANT_CODE] = request.TenantCode
			viewLayoutConfig[entity.PROPS] = props
		}

	case entity.TypeContainer, entity.TypeSection:
		// Handle container components
		if className == "" {
			viewLayoutConfig[entity.CLASS_NAME] = fmt.Sprintf("%s__%s", componentType, request.ObjectCode)
		}

		// Handle children recursively
		if children, ok := viewLayoutConfig["children"].([]any); ok {
			for i, child := range children {
				if childMap, ok := child.(map[string]any); ok {
					childConfig, err := handleViewLayout(childMap, fields, request)
					if err != nil {
						return nil, err
					}
					children[i] = childConfig
				}
			}
			viewLayoutConfig["children"] = children
		}
	}

	return viewLayoutConfig, nil
}

// Conversion function
func mapToStructSnakeCase(data map[string]entity.DataItem, target any) error {
	targetVal := reflect.ValueOf(target).Elem()

	for i := range targetVal.NumField() {
		field := targetVal.Type().Field(i)
		fieldName := field.Name
		snakeKey := helper.CamelToSnake(fieldName)

		// Check if key exists in data map
		if item, exists := data[snakeKey]; exists {
			targetField := targetVal.Field(i)

			// Ensure the field is settable
			if !targetField.IsValid() || !targetField.CanSet() || item.Value == nil {
				continue
			}

			value := reflect.ValueOf(item.Value)

			// Direct assignment if types match
			if value.Type().AssignableTo(targetField.Type()) {
				targetField.Set(value)
				continue
			}

			// Handle JSON string or []byte
			if value.Kind() == reflect.String || (value.Kind() == reflect.Slice && value.Type().Elem().Kind() == reflect.Uint8) {
				rawData := []byte(value.String())
				newValuePtr := reflect.New(targetField.Type()).Interface()

				// Try to unmarshal into the target type
				if err := json.Unmarshal(rawData, newValuePtr); err == nil {
					targetField.Set(reflect.ValueOf(newValuePtr).Elem())
				}
				continue
			}

			// Handle map[string]interface{}
			if value.Kind() == reflect.Map {
				// If target field is a struct, recursively map values
				if targetField.Kind() == reflect.Struct {
					newStruct := reflect.New(targetField.Type()).Interface()
					if err := mapToStructSnakeCase(convertToDataItemMap(value.Interface().(map[string]any)), newStruct); err == nil {
						targetField.Set(reflect.ValueOf(newStruct).Elem())
					}
					continue
				}

				// If target field is map[string]interface{}, set it directly
				if targetField.Type().AssignableTo(reflect.TypeOf(map[string]any{})) {
					targetField.Set(value)
					continue
				}
			}
		}
	}

	return nil
}

func convertToDataItemMap(input map[string]any) map[string]entity.DataItem {
	output := make(map[string]entity.DataItem)
	for key, val := range input {
		output[key] = entity.DataItem{Value: val}
	}
	return output
}
