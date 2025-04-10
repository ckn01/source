package repository

import (
	"context"

	"github.com/cerkas/cerkas-backend/core/entity"
)

type CatalogRepository interface {
	GetColumnList(ctx context.Context, request entity.CatalogQuery) (columns []map[string]interface{}, columnStrings string, joinQueryMap map[string]string, joinQueryOrder []string, err error)
	GetObjectData(ctx context.Context, request entity.CatalogQuery) (resp entity.CatalogResponse, err error)
	GetObjectDetail(ctx context.Context, request entity.CatalogQuery) (resp map[string]entity.DataItem, err error)
	GetDataByRawQuery(ctx context.Context, request entity.CatalogQuery) (resp entity.CatalogResponse, err error)
	CreateObjectData(ctx context.Context, request entity.DataMutationRequest) (resp entity.CatalogResponse, err error)
	UpdateObjectData(ctx context.Context, request entity.DataMutationRequest) (resp entity.CatalogResponse, err error)
	DeleteObjectData(ctx context.Context, request entity.DataMutationRequest) (err error)
	GetObjectFieldsByObjectCode(ctx context.Context, request entity.CatalogQuery) (resp map[string]any, err error)
	GetObjectByCode(ctx context.Context, objectCode, tenantCode string) (resp entity.Objects, err error)
	GetDataTypeBySerial(ctx context.Context, serial string) (resp entity.DataType, err error)
	GetDataTypeBySerials(ctx context.Context, serials []string) (resp []entity.DataType, err error)
}
