package catalogrepository

import (
	"encoding/json"
	"time"

	"database/sql"

	"github.com/cerkas/cerkas-backend/core/entity"
	"gorm.io/gorm"
)

type Tenants struct {
	ID        int            `gorm:"column:id" json:"id"`
	Serial    string         `gorm:"column:serial" json:"serial"`
	Code      string         `gorm:"column:code" json:"code"`
	Name      string         `gorm:"column:name" json:"name"`
	CreatedBy string         `gorm:"column:created_by" json:"created_by"`
	CreatedAt time.Time      `gorm:"column:created_at" json:"created_at"`
	UpdatedBy string         `gorm:"column:updated_by" json:"updated_by"`
	UpdatedAt time.Time      `gorm:"column:updated_at" json:"updated_at"`
	DeletedBy sql.NullString `gorm:"column:deleted_by" json:"deleted_by"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at" json:"deleted_at"`
}

type DataSource struct {
	ID           int                    `gorm:"column:id" json:"id"`
	Serial       string                 `gorm:"column:serial" json:"serial"`
	Code         string                 `gorm:"column:code" json:"code"`
	Name         string                 `gorm:"column:name" json:"name"`
	Description  string                 `gorm:"column:description" json:"description"`
	Host         string                 `gorm:"column:host" json:"host"`
	Port         string                 `gorm:"column:port" json:"port"`
	Username     string                 `gorm:"column:username" json:"username"`
	Password     string                 `gorm:"column:password" json:"password"`
	DBName       string                 `gorm:"column:db_name" json:"db_name"`
	DatabaseName string                 `gorm:"column:database_name" json:"database_name"`
	Configs      map[string]interface{} `gorm:"column:configs" json:"configs"`
	TenantSerial string                 `gorm:"column:tenant_serial" json:"tenant_serial"`
	CreatedBy    string                 `gorm:"column:created_by" json:"created_by"`
	CreatedAt    time.Time              `gorm:"column:created_at" json:"created_at"`
	UpdatedBy    string                 `gorm:"column:updated_by" json:"updated_by"`
	UpdatedAt    time.Time              `gorm:"column:updated_at" json:"updated_at"`
	DeletedBy    sql.NullString         `gorm:"column:deleted_by" json:"deleted_by"`
	DeletedAt    gorm.DeletedAt         `gorm:"column:deleted_at" json:"deleted_at"`
}

type Modules struct {
	ID                 int            `gorm:"column:id" json:"id"`
	Serial             string         `gorm:"column:serial" json:"serial"`
	Code               string         `gorm:"column:code" json:"code"`
	Name               string         `gorm:"column:name" json:"name"`
	ParentModuleSerial string         `gorm:"column:parent_module_serial" json:"parent_module_serial"`
	Version            string         `gorm:"column:version" json:"version"`
	CreatedBy          string         `gorm:"column:created_by" json:"created_by"`
	CreatedAt          time.Time      `gorm:"column:created_at" json:"created_at"`
	UpdatedBy          string         `gorm:"column:updated_by" json:"updated_by"`
	UpdatedAt          time.Time      `gorm:"column:updated_at" json:"updated_at"`
	DeletedBy          sql.NullString `gorm:"column:deleted_by" json:"deleted_by"`
	DeletedAt          gorm.DeletedAt `gorm:"column:deleted_at" json:"deleted_at"`
}

type Products struct {
	ID        int            `gorm:"column:id" json:"id"`
	Serial    string         `gorm:"column:serial" json:"serial"`
	Code      string         `gorm:"column:code" json:"code"`
	Name      string         `gorm:"column:name" json:"name"`
	IconURL   string         `gorm:"column:icon_url" json:"icon_url"`
	CreatedBy string         `gorm:"column:created_by" json:"created_by"`
	CreatedAt time.Time      `gorm:"column:created_at" json:"created_at"`
	UpdatedBy string         `gorm:"column:updated_by" json:"updated_by"`
	UpdatedAt time.Time      `gorm:"column:updated_at" json:"updated_at"`
	DeletedBy sql.NullString `gorm:"column:deleted_by" json:"deleted_by"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at" json:"deleted_at"`
}

type Objects struct {
	ID               int            `gorm:"column:id" json:"id"`
	Serial           string         `gorm:"column:serial" json:"serial"`
	TenantSerial     string         `gorm:"column:tenant_serial" json:"tenant_serial"`
	ModuleSerial     string         `gorm:"column:module_serial" json:"module_serial"`
	Code             string         `gorm:"column:code" json:"code"`
	DisplayName      string         `gorm:"column:display_name" json:"display_name"`
	Description      string         `gorm:"column:description" json:"description"`
	ObjectType       string         `gorm:"column:object_type" json:"object_type"`
	DataSourceSerial string         `gorm:"column:data_source_serial" json:"data_source_serial"`
	CreatedBy        string         `gorm:"column:created_by" json:"created_by"`
	CreatedAt        time.Time      `gorm:"column:created_at" json:"created_at"`
	UpdatedBy        string         `gorm:"column:updated_by" json:"updated_by"`
	UpdatedAt        time.Time      `gorm:"column:updated_at" json:"updated_at"`
	DeletedBy        sql.NullString `gorm:"column:deleted_by" json:"deleted_by"`
	DeletedAt        gorm.DeletedAt `gorm:"column:deleted_at" json:"deleted_at"`
}

func (o *Objects) ToEntity() entity.Objects {
	return entity.Objects{
		ID:          o.ID,
		Serial:      o.Serial,
		Tenant:      entity.Tenants{Serial: o.TenantSerial},
		Module:      entity.Modules{Serial: o.ModuleSerial},
		Code:        o.Code,
		DisplayName: o.DisplayName,
		Description: o.Description,
		ObjectType:  o.ObjectType,
		DataSource:  entity.DataSource{Serial: o.DataSourceSerial},
	}
}

type ObjectFields struct {
	ID                      int            `gorm:"column:id" json:"id"`
	Serial                  string         `gorm:"column:serial" json:"serial"`
	ObjectSerial            string         `gorm:"column:object_serial" json:"object_serial"`
	FieldCode               string         `gorm:"column:field_code" json:"field_code"`
	IsDisplayName           bool           `gorm:"column:is_display_name" json:"is_display_name"`
	DisplayName             string         `gorm:"column:display_name" json:"display_name"`
	FieldReference          string         `gorm:"column:field_reference" json:"field_reference"`
	Description             string         `gorm:"column:description" json:"description"`
	DataTypeSerial          string         `gorm:"column:data_type_serial" json:"data_type_serial"`
	ValidationRules         string         `gorm:"column:validation_rules" json:"validation_rules"`
	TargetObjectSerial      string         `gorm:"column:target_object_serial" json:"target_object_serial"`
	TargetObjectFieldSerial string         `gorm:"column:target_object_field_serial" json:"target_object_field_serial"`
	Relation                string         `gorm:"column:relation" json:"relation"`
	IsSystem                bool           `gorm:"column:is_system" json:"is_system"`
	CreatedBy               string         `gorm:"column:created_by" json:"created_by"`
	CreatedAt               time.Time      `gorm:"column:created_at" json:"created_at"`
	UpdatedBy               string         `gorm:"column:updated_by" json:"updated_by"`
	UpdatedAt               time.Time      `gorm:"column:updated_at" json:"updated_at"`
	DeletedBy               sql.NullString `gorm:"column:deleted_by" json:"deleted_by"`
	DeletedAt               gorm.DeletedAt `gorm:"column:deleted_at" json:"deleted_at"`
}

func (of *ObjectFields) TableName() string {
	return "object_fields"
}

func (of *ObjectFields) ToEntity() entity.ObjectFields {
	// convert validation rules from string to map
	validationRules := make(map[string]interface{})
	if err := json.Unmarshal([]byte(of.ValidationRules), &validationRules); err != nil {
		validationRules = nil
	}

	return entity.ObjectFields{
		ID:                of.ID,
		Serial:            of.Serial,
		Object:            entity.Objects{Serial: of.ObjectSerial},
		FieldCode:         of.FieldCode,
		IsDisplayName:     of.IsDisplayName,
		DisplayName:       of.DisplayName,
		FieldReference:    of.FieldReference,
		Description:       of.Description,
		DataType:          entity.DataType{Serial: of.DataTypeSerial},
		ValidationRules:   validationRules,
		TargetObject:      entity.Objects{Serial: of.TargetObjectSerial},
		TargetObjectField: map[string]interface{}{"serial": of.TargetObjectFieldSerial},
		Relation:          of.Relation,
		IsSystem:          of.IsSystem,
	}
}

type DataType struct {
	ID                int    `gorm:"column:id" json:"id"`
	Serial            string `gorm:"column:serial" json:"serial"`
	Code              string `gorm:"column:code" json:"code"`
	Name              string `gorm:"column:name" json:"name"`
	Description       string `gorm:"column:description" json:"description"`
	PrimitiveDataType string `gorm:"column:primitive_data_type" json:"primitive_data_type"`
	ValidationRules   string `gorm:"column:validation_rules" json:"validation_rules"`
	IsActive          bool   `gorm:"column:is_active" json:"is_active"`
	DisplayType       string `gorm:"column:display_type" json:"display_type"`
	FieldOptions      string `gorm:"column:field_options" json:"field_options"`
	Icon              string `gorm:"column:icon" json:"icon"`
}

func (dt *DataType) TableName() string {
	return "data_types"
}

func (dt *DataType) ToEntity() entity.DataType {
	// convert validation rules from string to map
	validationRules := make(map[string]interface{})
	if err := json.Unmarshal([]byte(dt.ValidationRules), &validationRules); err != nil {
		validationRules = nil
	}

	// convert field options from string to map
	fieldOptions := make(map[string]interface{})
	if err := json.Unmarshal([]byte(dt.FieldOptions), &fieldOptions); err != nil {
		fieldOptions = nil
	}

	return entity.DataType{
		ID:                dt.ID,
		Serial:            dt.Serial,
		Code:              dt.Code,
		Name:              dt.Name,
		Description:       dt.Description,
		PrimitiveDataType: dt.PrimitiveDataType,
		ValidationRules:   validationRules,
		IsActive:          dt.IsActive,
		DisplayType:       dt.DisplayType,
		FieldOptions:      fieldOptions,
	}
}

type ForeignKeyInfo struct {
	ForeignSchema string `gorm:"column:foreign_schema"`
	ForeignTable  string `gorm:"column:foreign_table"`
	ForeignColumn string `gorm:"column:foreign_column"`
}

func (fki *ForeignKeyInfo) ToEntity() entity.ForeignKeyInfo {
	return entity.ForeignKeyInfo{
		ForeignSchema: fki.ForeignSchema,
		ForeignTable:  fki.ForeignTable,
		ForeignColumn: fki.ForeignColumn,
	}
}
