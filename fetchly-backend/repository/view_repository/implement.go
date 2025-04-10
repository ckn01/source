package viewrepository

import (
	"context"
	"fmt"

	"github.com/cerkas/cerkas-backend/config"
	"github.com/cerkas/cerkas-backend/pkg/helper"
	"github.com/cerkas/cerkas-backend/repository/util"
	"gorm.io/gorm"

	"github.com/cerkas/cerkas-backend/core/entity"
	repository_intf "github.com/cerkas/cerkas-backend/core/repository"
)

type repository struct {
	db  *gorm.DB
	cfg config.Config
}

func New(db *gorm.DB, cfg config.Config) repository_intf.ViewRepository {
	return &repository{
		db:  db,
		cfg: cfg,
	}
}

func (r *repository) GetViewContentByKeys(ctx context.Context, request entity.GetViewContentByKeysRequest) (resp map[string]entity.DataItem, err error) {
	tenantCode := request.TenantCode
	if tenantCode == "" {
		tenantCode = "NULL"
	} else {
		tenantCode = fmt.Sprintf("'%s'", tenantCode)
	}

	productCode := request.ProductCode
	if productCode == "" {
		productCode = "NULL"
	} else {
		productCode = fmt.Sprintf("'%s'", productCode)
	}

	objectCode := request.ObjectCode
	if objectCode == "" {
		objectCode = "NULL"
	} else {
		objectCode = fmt.Sprintf("'%s'", objectCode)
	}

	viewContentCode := request.ViewContentCode
	if viewContentCode == "" {
		viewContentCode = "'default'"
	} else {
		viewContentCode = fmt.Sprintf("'%s'", viewContentCode)
	}

	layoutType := request.LayoutType
	if layoutType == "" {
		layoutType = "'record'"
	} else {
		layoutType = fmt.Sprintf("'%s'", layoutType)
	}

	query := fmt.Sprintf("SELECT * FROM get_view_content_all(%s, %s, %s, %s, %s)", tenantCode, productCode, objectCode, viewContentCode, layoutType)
	rows, err := r.db.Raw(query).Rows()
	if err != nil {
		return resp, err
	}
	defer rows.Close()

	// Get column names
	columnNames, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	// Get column types
	columnTypes, err := rows.ColumnTypes()
	if err != nil {
		return nil, err
	}

	// Prepare the result
	var columnsList []map[string]interface{}
	for i, colName := range columnNames {
		columnInfo := map[string]interface{}{
			entity.FieldDataType:           columnTypes[i].DatabaseTypeName(),                                  // SQL type
			entity.FieldColumnCode:         colName,                                                            // Column name as code
			entity.FieldColumnName:         helper.CapitalizeWords(helper.ReplaceUnderscoreWithSpace(colName)), // Use the column name as a placeholder for "name"
			entity.FieldCompleteColumnCode: colName,
		}

		columnsList = append(columnsList, columnInfo)
	}

	catalogQuery := entity.CatalogQuery{
		ObjectCode:  request.ObjectCode,
		TenantCode:  request.TenantCode,
		ProductCode: request.ProductCode,
	}

	for rows.Next() {
		item, err := util.HandleSingleRow(columnsList, rows, catalogQuery)
		if err != nil {
			return resp, err
		}

		resp = item
	}

	return resp, nil
}
