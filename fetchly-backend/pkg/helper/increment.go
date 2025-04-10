package helper

import "gorm.io/gorm"

func GetAutoIncrement(db *gorm.DB, tableName, columnName string) (int32, error) {
	var result float64
	if err := db.Table(tableName).Select("max(" + columnName + ")").Row().Scan(&result); err != nil {
		return 0, err
	}
	result = result + 1.
	return int32(result), nil
}
