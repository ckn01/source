package util

import (
	"database/sql"
	"encoding/json"
	"regexp"

	"github.com/cerkas/cerkas-backend/core/entity"
)

func HandleSingleRow(columnsList []map[string]interface{}, rows *sql.Rows, request entity.CatalogQuery) (item map[string]entity.DataItem, err error) {
	// Create a slice of interface{} to hold column values
	values := make([]any, len(columnsList))
	valuePointers := make([]any, len(columnsList))
	for i := range values {
		valuePointers[i] = &values[i]
	}

	// Scan the row
	if err := rows.Scan(valuePointers...); err != nil {
		return item, err
	}

	// Create a map for the row
	item = make(map[string]entity.DataItem)
	for i, colName := range columnsList {
		val := values[i]

		fieldName := colName[entity.FieldColumnCode].(string)
		FieldCode := colName[entity.FieldColumnCode].(string)

		if val, ok := request.Fields[FieldCode]; ok && val.FieldName != "" {
			fieldName = val.FieldName
		}

		// check if val is json
		isJson := IsJSON(val)
		if isJson {
			var jsonData map[string]any

			if err := json.Unmarshal([]byte(val.([]uint8)), &jsonData); err == nil {
				val = jsonData
			}
		}

		key := colName[entity.FieldColumnCode].(string)
		if _, ok := colName[entity.FieldOriginalFieldCode]; ok {
			key = colName[entity.FieldOriginalFieldCode].(string)
		}

		item[key] = entity.DataItem{
			FieldCode:    colName[entity.FieldColumnCode].(string),
			FieldName:    fieldName,
			DataType:     colName[entity.FieldDataType].(string),
			Value:        val,
			DisplayValue: val,
		}
	}

	return item, nil
}

func IsJSON(input any) bool {
	var temp any

	// Convert input to []byte if it's a string
	var data []byte
	switch v := input.(type) {
	case string:
		// Reject if the string is a pure number (integer or float)
		if isNumberString(v) {
			return false
		}
		data = []byte(v)
	case []byte:
		// Convert to string for number check
		if isNumberString(string(v)) {
			return false
		}
		data = v
	default:
		return false // Not a valid JSON candidate
	}

	// Try to unmarshal into a generic interface
	if err := json.Unmarshal(data, &temp); err != nil {
		return false // Not JSON
	}
	return true // Valid JSON
}

// isNumberString checks if a string is purely a number (integer or float)
func isNumberString(s string) bool {
	numberRegex := `^-?\d+(\.\d+)?([eE][+-]?\d+)?$`
	match, _ := regexp.MatchString(numberRegex, s)
	return match
}
