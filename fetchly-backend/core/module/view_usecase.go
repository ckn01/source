package module

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
	"strings"

	"github.com/cerkas/cerkas-backend/config"
	"github.com/cerkas/cerkas-backend/core/entity"
	"github.com/cerkas/cerkas-backend/core/repository"
	"github.com/cerkas/cerkas-backend/pkg/helper"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

type ViewUsecase interface {
	GetContentLayoutByKeys(ctx context.Context, request entity.GetViewContentByKeysRequest, catalogQuery entity.CatalogQuery) (resp entity.ViewContentResponse, err error)
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

	// fetching layout
	resp.Layout, err = handleViewLayout(resp.ViewContent.ViewLayout.LayoutConfig, resp.Fields, request)
	if err != nil {
		return resp, err
	}

	return resp, nil
}

func handleViewLayout(viewLayoutConfig map[string]any, fields []map[string]any, request entity.GetViewContentByKeysRequest) (map[string]any, error) {
	// TODO: inject view schema into view layout respectively

	/*
		example of view layout json:
		{
				"children": [
						{
								"class_name": "",
								"props": {},
								"type": "table"
						}
				],
				"class_name": "",
				"props": {},
				"type": "webView"
		}

		because the layout is dynamic, we need to handle it in a generic way
		it will always have children and type, and it can be recursive
	*/

	// check if viewLayoutConfig is nil
	if viewLayoutConfig == nil {
		return nil, nil
	}

	// check if viewLayoutConfig is a map
	if reflect.TypeOf(viewLayoutConfig).Kind() != reflect.Map {
		return nil, fmt.Errorf("viewLayoutConfig is not a map")
	}

	switch viewLayoutConfig["type"] {
	case "webView", "mobileView":
		// check if children is a slice
		if reflect.TypeOf(viewLayoutConfig["children"]).Kind() != reflect.Slice {
			return nil, fmt.Errorf("children is not a slice")
		}

		// iterate children
		for i := 0; i < reflect.ValueOf(viewLayoutConfig["children"]).Len(); i++ {
			child := reflect.ValueOf(viewLayoutConfig["children"]).Index(i)

			// do recursion
			childConfig, _ := handleViewLayout(child.Interface().(map[string]any), fields, request)

			if childConfig != nil {
				// set child config
				child.Set(reflect.ValueOf(childConfig))
			}
		}
	case "table", "detail", "form":
		className := ""
		if _, ok := viewLayoutConfig[entity.CLASS_NAME]; ok {
			className = viewLayoutConfig[entity.CLASS_NAME].(string)
		}

		if className == "" {
			viewLayoutConfig[entity.CLASS_NAME] = fmt.Sprintf("%s__%s", viewLayoutConfig["type"], request.ObjectCode)
		}

		props := map[string]any{}
		if _, ok := viewLayoutConfig[entity.PROPS]; ok {
			props = viewLayoutConfig[entity.PROPS].(map[string]any)
		}

		isInjectProps := false

		// check if field object code exists, if yes, then check if object code value is the same with the object code in request
		if objCode, exists := props[entity.OBJECT_CODE]; !exists || objCode.(string) == "" || objCode.(string) == request.ObjectCode {
			isInjectProps = true
		}

		if isInjectProps {
			// handle props injection from fields
			if _, ok := viewLayoutConfig[entity.PROPS]; ok {
				props := viewLayoutConfig[entity.PROPS].(map[string]any)
				props[entity.FIELDS] = fields
				props[entity.OBJECT_CODE] = request.ObjectCode
				props[entity.TENANT_CODE] = request.TenantCode

				viewLayoutConfig[entity.PROPS] = props
			}
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
