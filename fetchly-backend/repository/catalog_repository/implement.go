package catalogrepository

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"

	"github.com/cerkas/cerkas-backend/config"
	"github.com/cerkas/cerkas-backend/core/entity"
	repository_intf "github.com/cerkas/cerkas-backend/core/repository"
	"github.com/cerkas/cerkas-backend/pkg/helper"
	"github.com/cerkas/cerkas-backend/repository/util"
	"gorm.io/gorm"
)

type repository struct {
	cfg config.Config
	db  *gorm.DB
}

func New(cfg config.Config, db *gorm.DB) repository_intf.CatalogRepository {
	return &repository{
		cfg: cfg,
		db:  db,
	}
}

func (r *repository) GetColumnList(ctx context.Context, request entity.CatalogQuery) (columns []map[string]interface{}, columnStrings string, joinQueryMap map[string]string, joinQueryOrder []string, err error) {
	joinQueryMapAll := make(map[string]string)
	joinQueryOrderAll := make([]string, 0)

	// get list of column from request.ObjectCode
	listColumnQuery := fmt.Sprintf(`
	SELECT
    col.column_name as field_code, 
		col.udt_name as data_type,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_field_name
	FROM
			information_schema.columns AS col
	LEFT JOIN information_schema.key_column_usage AS kcu ON col.table_name = kcu.table_name
	AND col.column_name = kcu.column_name
	LEFT JOIN information_schema.constraint_column_usage AS ccu ON kcu.constraint_name = ccu.constraint_name
	WHERE
		col.table_schema = '%v' 
	AND col.table_name = '%v'
	`, request.TenantCode, request.ObjectCode)

	rows, err := r.db.Raw(listColumnQuery).Rows()
	if err != nil {
		return columns, columnStrings, joinQueryMap, joinQueryOrder, err
	}
	defer rows.Close()

	// iterate over the result to get value of column_name and data_type
	for rows.Next() {
		column := make(map[string]any)

		var columnCode, dataType, foreignTableName, foreignColumnName interface{}
		if err := rows.Scan(&columnCode, &dataType, &foreignTableName, &foreignColumnName); err != nil {
			return columns, columnStrings, joinQueryMap, joinQueryOrder, err
		}

		column[entity.FieldDataType] = dataType.(string)
		column[entity.FieldColumnCode] = columnCode.(string)
		column[entity.FieldColumnName] = columnCode.(string)
		column[entity.FieldCompleteColumnCode] = fmt.Sprintf("%v.%v.%v", request.TenantCode, request.ObjectCode, columnCode.(string))

		if foreignTableName != nil && foreignTableName.(string) != request.ObjectCode && foreignColumnName != nil && foreignColumnName.(string) != "id" {
			column[entity.FieldForeignTableName] = foreignTableName.(string)
			column[entity.FieldForeignColumnName] = foreignColumnName.(string)
		}

		columns = append(columns, column)
	}

	// filter columns if request.Fields is not empty
	if len(request.Fields) > 0 {
		var filteredColumns []map[string]any
		for fieldNameKey := range request.Fields {
			isFound := false

			if !strings.Contains(fieldNameKey, "__") {
				for _, column := range columns {
					if fieldNameKey == column[entity.FieldColumnCode] {
						isFound = true
						column[entity.FieldColumnCode] = fieldNameKey

						filteredColumns = append(filteredColumns, column)
					}
				}
			} else {
				// handle fieldName that has double underscore this indicates that it is a relationship field
				foreignFieldSet := strings.Split(fieldNameKey, "__")
				_, joinQueryMap := r.HandleChainingJoinQuery(ctx, "", fieldNameKey, request.ObjectCode, request, entity.FilterItem{})

				// append joinQueryMap to joinQueryMapAll
				for k, v := range joinQueryMap {
					joinQueryMapAll[k] = v
					joinQueryOrderAll = append(joinQueryOrderAll, k)
				}

				// split fieldName by double underscore
				foreignColumnName := fmt.Sprintf("%v.%v.%v", request.TenantCode, request.ObjectCode, foreignFieldSet[0])
				referenceColumnName := foreignFieldSet[1]

				if _, ok := joinQueryMap[fieldNameKey]; ok {
					fieldNameKeyList := strings.Split(fieldNameKey, "__")
					destinationColumn := fieldNameKeyList[len(fieldNameKeyList)-1]

					fieldName := fmt.Sprintf("%v.%v", fieldNameKey, destinationColumn)
					fieldCode := fieldName

					if val := request.Fields[fieldNameKey].FieldName; val != "" {
						fieldName = val
					}

					filteredColumn := map[string]any{
						entity.FieldOriginalFieldCode:  fieldNameKey,
						entity.FieldCompleteColumnCode: fieldCode,
						entity.FieldColumnCode:         fieldCode,
						entity.FieldColumnName:         fieldName,
						entity.FieldForeignColumnName:  foreignColumnName,
						entity.FieldDataType:           "text",
						entity.ForeignTable: map[string]string{
							entity.FieldForeignColumnName: referenceColumnName,
						},
					}

					filteredColumns = append(filteredColumns, filteredColumn)
				}

				isFound = true
			}

			// after finish iterating columns, if field is not found in columns, return error
			if !isFound {
				return columns, columnStrings, joinQueryMap, joinQueryOrder, fmt.Errorf("field %v is not found in table %v", fieldNameKey, request.ObjectCode)
			}
		}

		columns = filteredColumns
	}

	// convert columns to string
	for i, col := range columns {
		if i == 0 {
			columnStrings = col[entity.FieldCompleteColumnCode].(string)
		} else {
			columnStrings = columnStrings + ", " + col[entity.FieldCompleteColumnCode].(string)
		}
	}

	return columns, columnStrings, joinQueryMapAll, joinQueryOrderAll, err
}

func (r *repository) GetObjectData(ctx context.Context, request entity.CatalogQuery) (resp entity.CatalogResponse, err error) {
	// get list of column from request.ObjectCode
	completeTableName := request.TenantCode + "." + request.ObjectCode

	// Get list of columns
	columnsList, columnsString, joinQueryMap, joinQueryOrder, err := r.GetColumnList(ctx, request)
	fmt.Print("joinQueryMap: ", joinQueryMap)
	if err != nil {
		return resp, err
	}

	// Get total data count
	countQuery := r.getTotalCountQuery(ctx, completeTableName, request, joinQueryMap, joinQueryOrder)
	resultCount, err := r.db.Raw(countQuery).Rows()
	if err != nil {
		return resp, err
	}

	for resultCount.Next() {
		resultCount.Scan(&resp.TotalData)
	}

	// Get data with pagination
	dataQuery := r.getDataWithPagination(ctx, columnsString, completeTableName, request, joinQueryMap, joinQueryOrder)
	rows, err := r.db.Raw(dataQuery).Rows()
	if err != nil {
		return resp, err
	}
	defer rows.Close()

	for rows.Next() {
		item, err := util.HandleSingleRow(columnsList, rows, request)
		if err != nil {
			return resp, err
		}

		// Append the item to the catalog
		resp.Items = append(resp.Items, item)
	}

	resp.Page = request.Page
	resp.PageSize = request.PageSize
	resp.TotalPage = int(helper.GenerateTotalPage(int64(resp.TotalData), int64(request.PageSize)))

	return resp, nil
}

func (r *repository) GetObjectDetail(ctx context.Context, request entity.CatalogQuery) (resp map[string]entity.DataItem, err error) {
	// get list of column from request.ObjectCode
	completeTableName := request.TenantCode + "." + request.ObjectCode

	// Get list of columns
	columnsList, columnsString, _, _, err := r.GetColumnList(ctx, request)
	if err != nil {
		return resp, err
	}

	// get single data using serial in request
	dataQuery := getSingleData(columnsList, columnsString, completeTableName, request)
	rows, err := r.db.Raw(dataQuery).Rows()
	if err != nil {
		return resp, err
	}

	for rows.Next() {
		item, err := util.HandleSingleRow(columnsList, rows, request)
		if err != nil {
			return resp, err
		}

		resp = item
	}

	return resp, nil
}

func (r *repository) GetDataByRawQuery(ctx context.Context, request entity.CatalogQuery) (resp entity.CatalogResponse, err error) {
	// run raw query from request.RawQuery
	rawQuery := request.RawQuery

	// get total data based on rawQuery
	rawCountQuery := fmt.Sprintf("SELECT SUM(1) as total from (%s) as subquery", rawQuery)

	countRows, err := r.db.Raw(rawCountQuery).Rows()
	if err != nil {
		return resp, err
	}
	defer countRows.Close()

	var total int
	if countRows.Next() {
		err = countRows.Scan(&total)
		if err != nil {
			return resp, err
		}

		resp.TotalData = total
	}

	// add page and page size based on request.Page and request.PageSize
	rawQuery = fmt.Sprintf("%s LIMIT %d OFFSET %d", rawQuery, request.PageSize, (request.Page-1)*request.PageSize)

	rows, err := r.db.Raw(rawQuery).Rows()
	if err != nil {
		return resp, err
	}
	defer rows.Close()

	// get list of column from query result
	columns, err := rows.Columns()
	if err != nil {
		return resp, err
	}

	// iterate over the result to get value of column_name and data_type
	for rows.Next() {
		// Create a slice of interface{} to hold column values
		values := make([]interface{}, len(columns))
		valuePointers := make([]interface{}, len(columns))
		for i := range values {
			valuePointers[i] = &values[i]
		}

		// Scan the row
		if err := rows.Scan(valuePointers...); err != nil {
			return resp, err
		}

		// Create a map for the row
		item := make(map[string]entity.DataItem)
		for i, col := range columns {
			item[col] = entity.DataItem{
				FieldCode:    col,
				FieldName:    helper.CapitalizeWords(helper.ReplaceUnderscoreWithSpace(col)),
				DataType:     "text",
				Value:        values[i],
				DisplayValue: values[i],
			}
		}

		// Append the item to the catalog
		resp.Items = append(resp.Items, item)
	}

	resp.Page = request.Page
	resp.PageSize = request.PageSize
	resp.TotalPage = int(helper.GenerateTotalPage(int64(resp.TotalData), int64(request.PageSize)))

	return resp, nil
}

func (r *repository) CreateObjectData(ctx context.Context, request entity.DataMutationRequest) (resp entity.CatalogResponse, err error) {
	// INSERT INTO table_name (column1, column2, column3, ...)
	// VALUES (value1, value2, value3, ...);

	// get list of column from request.ObjectCode
	completeTableName := request.TenantCode + "." + request.ObjectCode

	// loop through data items and get the values
	var columnCodeString string
	var valueString string
	for _, item := range request.Items {
		columnCodeString = columnCodeString + ", " + item.FieldCode

		if item.Value == nil {
			valueString = valueString + ", NULL"
		} else {
			switch item.DataType {
			case "text":
				valueString = valueString + fmt.Sprintf(", '%v'", item.Value)
			case "integer":
				valueString = valueString + fmt.Sprintf(", %v", item.Value)
			case "boolean":
				valueString = valueString + fmt.Sprintf(", %v", item.Value)
			default:
				valueString = valueString + fmt.Sprintf(", '%v'", item.Value)
			}
		}
	}

	if len(valueString) == 0 {
		return resp, errors.New("no data item found")
	}

	columnCodeString = columnCodeString[2:]
	valueString = valueString[2:]

	// insert into query string
	insertQuery := fmt.Sprintf("INSERT INTO %v (%v) VALUES (%v)", completeTableName, columnCodeString, valueString)
	log.Printf("insertQuery: %v", insertQuery)

	// execute insert query
	if err := r.db.Exec(insertQuery).Error; err != nil {
		return resp, err
	}

	return resp, nil
}

func (r *repository) UpdateObjectData(ctx context.Context, request entity.DataMutationRequest) (resp entity.CatalogResponse, err error) {
	// UPDATE table_name
	// SET column1 = value1, column2 = value2, ...
	// WHERE condition;

	return resp, nil
}

func (r *repository) DeleteObjectData(ctx context.Context, request entity.DataMutationRequest) (err error) {
	return nil
}

func isOperatorInLIKEList(operator entity.FilterOperator) bool {
	for _, validOperator := range entity.OperatorLIKEList {
		if operator == validOperator {
			return true
		}
	}
	return false
}

func (r *repository) GetObjectByCode(ctx context.Context, objectCode, tenantCode string) (resp entity.Objects, err error) {
	db := r.db.Model(&Objects{})
	db.Joins("JOIN tenants ON tenants.serial = objects.tenant_serial")
	db.Where("objects.code = ?", objectCode)
	db.Where("tenants.code = ?", tenantCode)

	result := Objects{}
	if err := db.First(&result).Error; err != nil {
		return resp, err
	}

	return result.ToEntity(), nil
}

func (r *repository) GetObjectFieldsByObjectCode(ctx context.Context, request entity.CatalogQuery) (resp map[string]any, err error) {
	// get list of column from request.ObjectCode
	resp = make(map[string]any)

	db := r.db.Model(&ObjectFields{})

	if r.cfg.IsDebugMode {
		db = db.Debug()
	}

	results := []ObjectFields{}
	if err := db.Where("object_serial = ?", request.ObjectSerial).Find(&results).Error; err != nil {
		return resp, err
	}

	// iterate over the result to get value of column_name and data_type
	for _, result := range results {
		resp[result.FieldCode] = result.ToEntity()
	}

	return resp, nil
}

func (r *repository) GetDataTypeBySerial(ctx context.Context, serial string) (resp entity.DataType, err error) {
	db := r.db.Model(&DataType{})
	db.Where("serial = ?", serial)

	result := DataType{}
	if err := db.First(&result).Error; err != nil {
		return resp, err
	}

	return result.ToEntity(), nil
}

func (r *repository) GetDataTypeBySerials(ctx context.Context, serials []string) (resp []entity.DataType, err error) {
	if len(serials) == 0 {
		return resp, nil // Return an empty response if no serials are provided
	}

	db := r.db.Model(&DataType{})

	if r.cfg.IsDebugMode {
		db = db.Debug()
	}

	var results []DataType
	if err := db.Where("serial IN ?", serials).Find(&results).Error; err != nil {
		return resp, fmt.Errorf("failed to fetch data types: %w", err)
	}

	for _, result := range results {
		resp = append(resp, result.ToEntity())
	}

	return resp, nil
}

func (r *repository) GetForeignKeyInfo(ctx context.Context, tableName, columnName, schemaName string) (resp entity.ForeignKeyInfo, err error) {
	query := `
	SELECT
		ccu.table_schema AS foreign_schema,
		ccu.table_name   AS foreign_table,
		ccu.column_name  AS foreign_column
	FROM
		information_schema.table_constraints AS tc
		JOIN information_schema.key_column_usage AS kcu
		  ON tc.constraint_name = kcu.constraint_name
		 AND tc.constraint_schema = kcu.constraint_schema
		JOIN information_schema.constraint_column_usage AS ccu
		  ON ccu.constraint_name = tc.constraint_name
		 AND ccu.constraint_schema = tc.constraint_schema
	WHERE
		tc.constraint_type = 'FOREIGN KEY'
		AND kcu.column_name = ?
		AND tc.table_name = ?
		AND tc.table_schema = ?
	LIMIT 1;
	`

	result := ForeignKeyInfo{}
	if err = r.db.Raw(query, columnName, tableName, schemaName).Scan(&result).Error; err != nil {
		return resp, err
	}

	return result.ToEntity(), nil
}

// local function

// Helper function to build dynamic filters based on CatalogQuery
func (r *repository) buildFilters(_ context.Context, request entity.CatalogQuery, tableName string) string {
	var filterClauses []string

	for _, filterGroup := range request.Filters {
		var groupClauses []string

		for fieldName, filter := range filterGroup.Filters {
			operator := entity.OperatorQueryMap[filter.Operator]
			value := filter.Value

			// handler value of operator is part of entity.OperatorLIKEList, then we should add %
			if isOperatorInLIKEList(filter.Operator) {
				value = fmt.Sprintf("%%%v%%", value)
			}

			// Create filter conditions based on the field, operator, and value
			var formattedValue string

			switch v := value.(type) {
			case string:
				// Wrap strings in single quotes
				formattedValue = fmt.Sprintf("'%s'", v)
			case bool:
				// Booleans: PostgreSQL uses true/false literals
				formattedValue = fmt.Sprintf("%t", v)
			case int, int8, int16, int32, int64:
				formattedValue = fmt.Sprintf("%d", v)
			case float32, float64:
				formattedValue = fmt.Sprintf("%f", v)
			default:
				// Fallback to string with single quotes
				formattedValue = fmt.Sprintf("'%v'", v)
			}

			if strings.Contains(fieldName, "__") {
				foreignFieldSet := strings.Split(fieldName, "__")
				lastFieldName := foreignFieldSet[1]

				fieldName = fmt.Sprintf("%v.%v", fieldName, lastFieldName)
			} else {
				// Prefix the field name with the table name
				fieldName = fmt.Sprintf("%v.%v", tableName, fieldName)
			}

			groupClauses = append(groupClauses, fmt.Sprintf("%s %s %s", fieldName, operator, formattedValue))
		}
		// Combine the group clauses with the group operator (AND/OR)
		filterClauses = append(filterClauses, fmt.Sprintf("(%s)", strings.Join(groupClauses, fmt.Sprintf(" %s ", filterGroup.Operator))))
	}

	filterQuery := strings.Join(filterClauses, " AND ")

	return filterQuery
}

// Helper function to build dynamic order by clauses
func buildOrderBy(request entity.CatalogQuery) string {
	var orderClauses []string
	for _, order := range request.Orders {
		fieldName := fmt.Sprintf("%v.%v.%v", request.TenantCode, request.ObjectCode, order.FieldName)
		orderClauses = append(orderClauses, fmt.Sprintf("%s %s", fieldName, order.Direction))
	}
	return strings.Join(orderClauses, ", ")
}

func getSingleData(columnList []map[string]interface{}, columnsString, tableName string, request entity.CatalogQuery) string {
	// Start building the base query
	query := fmt.Sprintf(`
		SELECT %v
		FROM %v`, columnsString, tableName)

	// handle join table if any
	for _, column := range columnList {
		if column[entity.ForeignTable] != nil {
			foreignTableName := column[entity.ForeignTable].(map[string]string)[entity.FieldForeignTableName]
			foreignTableReferenceColumnName := column[entity.ForeignTable].(map[string]string)[entity.ForeignReferenceColumnName]

			joinClause := fmt.Sprintf("LEFT JOIN %v ON %v = %v.%v", foreignTableName, column[entity.FieldForeignColumnName], foreignTableName, foreignTableReferenceColumnName)

			if !strings.Contains(query, joinClause) {
				query = fmt.Sprintf("%s %s", query, joinClause)
			}
		}
	}

	query = query + fmt.Sprintf(" WHERE %v.deleted_at IS NULL", tableName)

	// apply serial to get single data
	identifierColumn := "serial"
	if !helper.IsUUID(request.Serial) {
		identifierColumn = "code"
	}

	query = query + fmt.Sprintf(" AND %v.%v = '%v'", tableName, identifierColumn, request.Serial)

	return query
}

// Main function to get data with pagination, filters, and orders
func (r *repository) getDataWithPagination(ctx context.Context, columnsString, tableName string, request entity.CatalogQuery, joinQueryMap map[string]string, joinQueryOrder []string) string {
	// Start building the base query
	query := fmt.Sprintf(`SELECT %v FROM %v`, columnsString, tableName)

	// handle join table if any
	for _, joinKey := range joinQueryOrder {
		if !strings.Contains(query, joinQueryMap[joinKey]) {
			query = fmt.Sprintf("%s %s", query, joinQueryMap[joinKey])
		}
	}

	// checking if filters contains join table condition
	for _, filterGroup := range request.Filters {
		for fieldName, filter := range filterGroup.Filters {
			if strings.Contains(fieldName, "__") {
				queryResult, joinQueryMap := r.HandleChainingJoinQuery(ctx, query, fieldName, tableName, request, filter)
				query = queryResult

				fmt.Print("joinQueryMap: ", joinQueryMap)
			}
		}
	}

	query = query + fmt.Sprintf(" WHERE %v.deleted_at IS NULL", tableName)

	// Apply dynamic filters if they exist
	if len(request.Filters) > 0 {
		query = query + " AND " + r.buildFilters(ctx, request, tableName)
	}

	// Apply dynamic order by if they exist
	if len(request.Orders) > 0 {
		query = query + " ORDER BY " + buildOrderBy(request)
	}

	// Apply pagination (LIMIT and OFFSET)
	query = fmt.Sprintf("%s LIMIT %d OFFSET %d", query, request.PageSize, (request.Page-1)*request.PageSize)
	log.Print(query)

	return query
}

func (r *repository) getTotalCountQuery(ctx context.Context, tableName string, request entity.CatalogQuery, joinQueryMap map[string]string, joinQueryOrder []string) string {
	query := fmt.Sprintf(`SELECT COUNT(*) FROM %v`, tableName)

	// integrate join query if any
	for _, joinKey := range joinQueryOrder {
		if !strings.Contains(query, joinQueryMap[joinKey]) {
			query = fmt.Sprintf("%s %s", query, joinQueryMap[joinKey])
		}
	}

	// checking if filters contains join table condition
	for _, filterGroup := range request.Filters {
		for fieldName, filter := range filterGroup.Filters {
			if strings.Contains(fieldName, "__") {
				queryResult, joinQueryMap := r.HandleChainingJoinQuery(ctx, query, fieldName, tableName, request, filter)
				query = queryResult

				fmt.Print("joinQueryMap: ", joinQueryMap)
			}
		}
	}

	query += fmt.Sprintf(` WHERE %v.deleted_at IS NULL`, tableName)

	// Apply dynamic filters if they exist
	if len(request.Filters) > 0 {
		query = query + " AND " + r.buildFilters(ctx, request, tableName)
	}

	log.Print(query)
	return query
}

func (r *repository) HandleChainingJoinQuery(ctx context.Context, query, fieldName, tableName string, request entity.CatalogQuery, filter entity.FilterItem) (updatedQuery string, joinQueryMap map[string]string) {
	// case example: user_serial__user_type_serial__name
	joinQueryMap = make(map[string]string)
	joinQuery := query

	foreignFieldSet := strings.Split(fieldName, "__")
	cleanTableName := strings.Split(tableName, ".")

	currentTableName := cleanTableName[0]
	if len(cleanTableName) > 1 {
		currentTableName = cleanTableName[1]
	}

	nextJoinAlias := ""

	for i, foreignField := range foreignFieldSet {
		if i < len(foreignFieldSet)-1 {
			foreignKeyInfo, _ := r.GetForeignKeyInfo(ctx, currentTableName, foreignField, request.TenantCode)
			foreignTableName := fmt.Sprintf("%v.%v", request.TenantCode, foreignKeyInfo.ForeignTable)

			// check if i is the last element
			joinAlias := fieldName
			if i < len(foreignFieldSet)-2 {
				joinAliasUpdated := fmt.Sprintf("%v__%v", currentTableName, foreignField)
				joinAlias = joinAliasUpdated
			}

			joinAliasField := joinAlias
			joinTableName := currentTableName
			if nextJoinAlias != "" {
				joinTableName = nextJoinAlias
			}

			foreignFieldName := fmt.Sprintf("%v.%v", joinAliasField, foreignKeyInfo.ForeignColumn)
			sourceFieldName := fmt.Sprintf("%v.%v", joinTableName, foreignField)

			joinClause := fmt.Sprintf("LEFT JOIN %v as %v ON %v = %v", foreignTableName, joinAlias, foreignFieldName, sourceFieldName)
			if !strings.Contains(joinQuery, joinClause) {
				joinQuery = fmt.Sprintf("%s %s", joinQuery, joinClause)
			}

			joinQueryMap[joinAlias] = joinClause

			currentTableName = foreignKeyInfo.ForeignTable
			nextJoinAlias = joinAlias
		}
	}

	return joinQuery, joinQueryMap
}

func (r *repository) HandleJoinQuery(ctx context.Context, query, fieldName, tableName string, request entity.CatalogQuery, filter entity.FilterItem) (updatedQuery string) {
	// if fieldName contains double underscore, then we need to join the table
	foreignFieldSet := strings.Split(fieldName, "__")

	// get foreign table name based on fieldName
	cleanTableName := strings.Split(tableName, ".")
	foreignKeyInfo, _ := r.GetForeignKeyInfo(ctx, cleanTableName[1], foreignFieldSet[0], request.TenantCode)

	foreignTableName := fmt.Sprintf("%v.%v", request.TenantCode, foreignKeyInfo.ForeignTable)
	foreignFieldName := fmt.Sprintf("%v.%v", foreignTableName, foreignKeyInfo.ForeignColumn)
	sourceFieldName := fmt.Sprintf("%v.%v", tableName, foreignFieldSet[0])

	joinClause := fmt.Sprintf("LEFT JOIN %v ON %v = %v", foreignTableName, foreignFieldName, sourceFieldName)

	if !strings.Contains(query, joinClause) {
		query = fmt.Sprintf("%s %s", query, joinClause)
	}

	// add filter condition to query
	operator := entity.OperatorQueryMap[filter.Operator]
	value := filter.Value

	// handler value of operator is part of entity.OperatorLIKEList, then we should add %
	if isOperatorInLIKEList(filter.Operator) {
		value = fmt.Sprintf("%%%v%%", value)
	}

	var formattedValue string

	switch v := value.(type) {
	case string:
		// Wrap strings in single quotes
		formattedValue = fmt.Sprintf("'%s'", v)
	case bool:
		// Booleans: PostgreSQL uses true/false literals
		formattedValue = fmt.Sprintf("%t", v)
	case int, int8, int16, int32, int64:
		formattedValue = fmt.Sprintf("%d", v)
	case float32, float64:
		formattedValue = fmt.Sprintf("%f", v)
	default:
		// Fallback to string with single quotes
		formattedValue = fmt.Sprintf("'%v'", v)
	}

	// Create filter conditions based on the field, operator, and value
	query = fmt.Sprintf("%s AND %s %s %s", query, fmt.Sprintf("%v.%v", foreignTableName, foreignFieldSet[1]), operator, formattedValue)

	return query
}
