package module

import (
	"context"
	"fmt"
	"strings"

	"golang.org/x/text/cases"
	"golang.org/x/text/language"

	"github.com/cerkas/cerkas-backend/config"
	"github.com/cerkas/cerkas-backend/core/entity"
	"github.com/cerkas/cerkas-backend/core/repository"
)

type CatalogUsecase interface {
	GetObjectData(ctx context.Context, request entity.CatalogQuery) (resp entity.CatalogResponse, err error)
	GetObjectDetail(ctx context.Context, request entity.CatalogQuery, serial string) (resp map[string]entity.DataItem, err error)
	GetDataByRawQuery(ctx context.Context, request entity.CatalogQuery) (resp entity.CatalogResponse, err error)
	CreateObjectData(ctx context.Context, request entity.DataMutationRequest) (resp entity.CatalogResponse, err error)
	UpdateObjectData(ctx context.Context, request entity.DataMutationRequest) (resp entity.CatalogResponse, err error)
	DeleteObjectData(ctx context.Context, request entity.DataMutationRequest) (err error)
	GetObjectFieldsByObjectCode(ctx context.Context, request entity.CatalogQuery) (resp map[string]any, err error)
	GetContentLayoutByKeys(ctx context.Context, request entity.GetViewContentByKeysRequest, catalogQuery entity.CatalogQuery) (resp entity.ViewContentResponse, err error)
}

type catalogUsecase struct {
	cfg         config.Config
	catalogRepo repository.CatalogRepository
	viewRepo    repository.ViewRepository
}

func NewCatalogUsecase(cfg config.Config, catalogRepo repository.CatalogRepository, viewRepo repository.ViewRepository) CatalogUsecase {
	return &catalogUsecase{
		cfg:         cfg,
		catalogRepo: catalogRepo,
		viewRepo:    viewRepo,
	}
}

func (uc *catalogUsecase) GetObjectFieldsByObjectCode(ctx context.Context, request entity.CatalogQuery) (resp map[string]any, err error) {
	result, err := uc.catalogRepo.GetObjectFieldsByObjectCode(ctx, request)
	if err != nil {
		return resp, err
	}

	dataTypeSerials := []string{}
	for _, item := range result {
		data := item.(entity.ObjectFields)

		if data.ID != 0 {
			dataTypeSerials = append(dataTypeSerials, data.DataType.Serial)
		}
	}

	// get data type by serial
	dataType, _ := uc.catalogRepo.GetDataTypeBySerials(ctx, dataTypeSerials)

	// map data type to result
	dataTypeMap := make(map[string]entity.DataType)
	for _, item := range dataType {
		dataTypeMap[item.Serial] = item
	}

	// iterate result and map data type to result
	for i, item := range result {
		data := item.(entity.ObjectFields)
		if data.ID != 0 {
			if dataType, ok := dataTypeMap[data.DataType.Serial]; ok {
				data.DataType = dataType
			}
			result[i] = data
		}
	}

	return result, err
}

func (uc *catalogUsecase) GetObjectData(ctx context.Context, request entity.CatalogQuery) (resp entity.CatalogResponse, err error) {
	// inject view schema to get field config and query, and combine it to request fields and filters
	viewContent, err := uc.GetContentLayoutByKeys(ctx, entity.GetViewContentByKeysRequest{
		TenantCode:      request.TenantCode,
		ProductCode:     request.ProductCode,
		ObjectCode:      request.ObjectCode,
		ViewContentCode: request.ViewContentCode,
		LayoutType:      "record",
	}, request)
	if err != nil {
		return resp, err
	}

	combinedQuery := entity.CatalogQuery{
		Fields: map[string]entity.Field{},
	}

	viewSchemaRecord := viewContent.ViewContent.ViewSchema
	viewSchemaQuery := viewSchemaRecord.Query
	viewSchemaQueryFilters := []any{}

	if _, ok := viewSchemaQuery["filters"]; ok {
		if filters, ok := viewSchemaQuery["filters"].([]any); ok {
			viewSchemaQueryFilters = filters
		}
	}

	for _, filter := range viewSchemaQueryFilters {
		filterGroup := entity.FilterGroup{}
		if filterMap, ok := filter.(map[string]any); ok {
			if operator, ok := filterMap["operator"].(string); ok {
				filterGroup.Operator = entity.FilterOperator(operator)
			}

			if filterItem, ok := filterMap["filter_item"].(map[string]any); ok {
				fmt.Printf("filterItem: %+v\n", filterItem)
				filterGroup.Filters = make(map[string]entity.FilterItem)
				for key, item := range filterItem {
					if itemMap, ok := item.(map[string]any); ok {
						filterItem := entity.FilterItem{}
						if fieldCode, ok := itemMap["field_code"].(string); ok {
							filterItem.FieldName = fieldCode
						}
						if operator, ok := itemMap["operator"].(string); ok {
							filterItem.Operator = entity.FilterOperator(operator)
						}
						if value, ok := itemMap["value"]; ok {
							filterItem.Value = value
						}

						if filterItem.Value != "" {
							filterGroup.Filters[key] = filterItem
						}
					}
				}
			}
		}

		combinedQuery.Filters = append(combinedQuery.Filters, filterGroup)
	}

	// combine combonedQuery with request
	if len(request.Filters) > 0 {
		for _, filter := range request.Filters {
			filterGroup := entity.FilterGroup{}

			if filter.Operator != "" {
				filterGroup.Operator = filter.Operator
			}

			if len(filter.Filters) > 0 {
				filterGroup.Filters = make(map[string]entity.FilterItem)

				for key, item := range filter.Filters {
					if item.Operator != "" {
						filterGroup.Filters[key] = entity.FilterItem{
							FieldName: item.FieldName,
							Operator:  item.Operator,
							Value:     item.Value,
						}
					}
				}
			}

			combinedQuery.Filters = append(combinedQuery.Filters, filterGroup)
		}
	}

	request.Filters = combinedQuery.Filters

	// combine request.Fields with view schema fields
	viewSchemaFields := viewSchemaRecord.DisplayField
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

			combinedQuery.Fields[key] = field
		}
	}

	// combine request.Orders with view schema orders
	if len(request.Fields) > 0 {
		for key, field := range request.Fields {
			if _, ok := combinedQuery.Fields[key]; !ok {
				combinedQuery.Fields[key] = field
			}
		}
	}

	request.Fields = combinedQuery.Fields

	results, err := uc.catalogRepo.GetObjectData(ctx, request)
	if err != nil {
		return resp, err
	}

	objects, _ := uc.catalogRepo.GetObjectByCode(ctx, request.ObjectCode, request.TenantCode)
	objectFields := map[string]any{}

	if objects.Serial != "" {
		request.ObjectSerial = objects.Serial
		request.TenantSerial = objects.Tenant.Serial

		// handle custom object fields based on object field table
		objectFields, err = uc.GetObjectFieldsByObjectCode(ctx, request)
		if err != nil {
			return resp, err
		}
	}

	// iterate object fields and map to response
	for i, items := range results.Items {
		for j, item := range items {
			// put field code to complete field code, and assign new value to field code with column name only after splitted
			// example: item.FieldCode = "object.field_code" => item.CompleteFieldCode = "object.field_code" and item.FieldCode = "field_code"
			item.CompleteFieldCode = item.FieldCode

			fieldCode := ""

			// split item.FieldCode by dot
			if len(item.FieldCode) > 0 {
				split := strings.Split(item.FieldCode, ".")

				// find the last element
				fieldCode = split[len(split)-1]
			}

			if fieldCode == "" {
				continue
			}

			item.FieldCode = fieldCode
			// set field name to field code, but remove underscore and make it camel case
			// example: item.FieldCode = "object_field_code" => item.FieldName = "ObjectFieldCode"
			item.FieldName = strings.ReplaceAll(item.FieldCode, "_", " ")
			item.FieldName = cases.Title(language.English).String(item.FieldName)

			if field, ok := objectFields[fieldCode]; ok {
				data, ok := field.(entity.ObjectFields)
				if !ok {
					continue
				}

				// set custom field name
				item.FieldName = data.DisplayName

				// set custom data type
				item.DataType = data.DataType.Name
			}

			if requestDisplayName, ok := request.Fields[item.CompleteFieldCode]; ok {
				// set custom field name
				item.FieldName = requestDisplayName.FieldName
			}

			// set item.DataType to CamelCase
			item.DataType = cases.Title(language.English).String(item.DataType)

			results.Items[i][j] = item
		}
	}

	return results, err
}

func (uc *catalogUsecase) GetObjectDetail(ctx context.Context, request entity.CatalogQuery, serial string) (resp map[string]entity.DataItem, err error) {
	request.Serial = serial

	return uc.catalogRepo.GetObjectDetail(ctx, request)
}

func (uc *catalogUsecase) GetDataByRawQuery(ctx context.Context, request entity.CatalogQuery) (resp entity.CatalogResponse, err error) {
	return uc.catalogRepo.GetDataByRawQuery(ctx, request)
}

func (uc *catalogUsecase) CreateObjectData(ctx context.Context, request entity.DataMutationRequest) (resp entity.CatalogResponse, err error) {
	return uc.catalogRepo.CreateObjectData(ctx, request)
}

func (uc *catalogUsecase) UpdateObjectData(ctx context.Context, request entity.DataMutationRequest) (resp entity.CatalogResponse, err error) {
	return uc.catalogRepo.UpdateObjectData(ctx, request)
}

func (uc *catalogUsecase) DeleteObjectData(ctx context.Context, request entity.DataMutationRequest) (err error) {
	return uc.catalogRepo.DeleteObjectData(ctx, request)
}

func (uc *catalogUsecase) GetContentLayoutByKeys(ctx context.Context, request entity.GetViewContentByKeysRequest, catalogQuery entity.CatalogQuery) (resp entity.ViewContentResponse, err error) {
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
		}
	}

	originalFields, _, _, _, err := uc.catalogRepo.GetColumnList(ctx, catalogQuery)
	if err != nil {
		return resp, err
	}

	// handle custom object fields based on object field table
	objectFields := map[string]any{}
	if catalogQuery.ObjectSerial != "" {
		objectFields, err = uc.GetObjectFieldsByObjectCode(ctx, catalogQuery)
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
