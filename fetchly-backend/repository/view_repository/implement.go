package viewrepository

import (
	"context"
	"fmt"

	"github.com/fetchlydev/source/fetchly-backend/config"
	"github.com/fetchlydev/source/fetchly-backend/pkg/helper"
	"github.com/fetchlydev/source/fetchly-backend/repository/util"
	"gorm.io/gorm"

	"github.com/fetchlydev/source/fetchly-backend/core/entity"
	repository_intf "github.com/fetchlydev/source/fetchly-backend/core/repository"
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

	db := r.db

	if r.cfg.IsDebugMode {
		db.Debug()
	}

	query := fmt.Sprintf("SELECT * FROM get_view_content_all(%s, %s, %s, %s, %s)", tenantCode, productCode, objectCode, viewContentCode, layoutType)
	rows, err := db.Raw(query).Rows()
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

	// Prepare the resul
	var columnsList []map[string]any
	for i, colName := range columnNames {
		columnInfo := map[string]any{
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

	if rows.Next() {
		item, err := util.HandleSingleRow(columnsList, rows, catalogQuery)
		if err != nil {
			return resp, err
		}

		resp = item
	}

	return resp, nil
}

func (r *repository) GetNavigationByViewContentSerial(ctx context.Context, request entity.GetNavigationItemByViewContentSerialRequest) (resp []entity.Navigation, err error) {
	db := r.db.Model(&Navigation{})

	if r.cfg.IsDebugMode {
		db.Debug()
	}

	if request.ViewContentSerial == "" {
		return resp, fmt.Errorf("view content serial is required")
	}

	db.Where("view_content_serial = ?", request.ViewContentSerial)

	results := []Navigation{}
	if err := db.Find(&results).Error; err != nil {
		return resp, err
	}

	for _, val := range results {
		resp = append(resp, val.ToEntity())
	}

	return resp, nil
}
