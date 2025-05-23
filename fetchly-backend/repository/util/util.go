package util

import (
	"database/sql"
	"encoding/json"
	"regexp"

	"github.com/fetchlydev/source/fetchly-backend/core/entity"
)

func HandleSingleRow(columnsList []map[string]any, rows *sql.Rows, request entity.CatalogQuery) (item map[string]entity.DataItem, err error) {
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
			// Try to unmarshal as array of maps first
			var jsonArray []map[string]any
			if err := json.Unmarshal([]byte(val.([]uint8)), &jsonArray); err == nil {
				val = jsonArray
			} else {
				// If not an array, try as single map
				var jsonData map[string]any
				if err := json.Unmarshal([]byte(val.([]uint8)), &jsonData); err == nil {
					val = jsonData
				}
			}
		}

		key := colName[entity.FieldColumnCode].(string)
		if _, ok := colName[entity.FieldOriginalFieldCode]; ok {
			key = colName[entity.FieldOriginalFieldCode].(string)
		}

		// TODO: handle display value
		displayValue := val
		additionalData := map[string]any{}

		if colName["foreign_table_name"] != nil {
			additionalData["foreign_table_name"] = colName["foreign_table_name"]
		}

		if colName["foreign_field_name"] != nil {
			additionalData["foreign_field_name"] = colName["foreign_field_name"]
		}

		item[key] = entity.DataItem{
			FieldCode:      colName[entity.FieldColumnCode].(string),
			FieldName:      fieldName,
			DataType:       colName[entity.FieldDataType].(string),
			Value:          val,
			DisplayValue:   displayValue,
			AdditionalData: additionalData,
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
