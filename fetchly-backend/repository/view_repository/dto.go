package viewrepository

import (
	"database/sql"
	"time"

	"github.com/cerkas/cerkas-backend/core/entity"
	"gorm.io/gorm"
)

type ViewLayout struct {
}

type ViewSchema struct {
}

type ViewContent struct {
}

type Navigation struct {
	ID                int            `gorm:"column:id" json:"id"`
	Serial            string         `gorm:"column:serial" json:"serial"`
	CreatedBy         string         `gorm:"column:created_by" json:"created_by"`
	CreatedAt         time.Time      `gorm:"column:created_at" json:"created_at"`
	UpdatedBy         string         `gorm:"column:updated_by" json:"updated_by"`
	UpdatedAt         time.Time      `gorm:"column:updated_at" json:"updated_at"`
	DeletedBy         sql.NullString `gorm:"column:deleted_by" json:"deleted_by"`
	DeletedAt         gorm.DeletedAt `gorm:"column:deleted_at" json:"deleted_at"`
	ViewContentSerial string         `gorm:"column:view_content_serial" json:"view_content_serial"`
	Code              string         `gorm:"column:code" json:"code"`
	Title             string         `gorm:"column:title" json:"title"`
	Description       string         `gorm:"column:description" json:"description"`
	URL               string         `gorm:"column:url" json:"url"`
	NavigationLevel   int32          `gorm:"column:navigation_level" json:"navigation_level"`
	Path              string         `gorm:"column:path" json:"path"`
}

func (n *Navigation) ToEntity() entity.Navigation {
	return entity.Navigation{
		ViewContent:     entity.ViewContent{Serial: n.ViewContentSerial},
		Code:            n.Code,
		Serial:          n.Serial,
		Title:           n.Title,
		Description:     n.Description,
		URL:             n.URL,
		NavigationLevel: n.NavigationLevel,
		Path:            n.Path,
	}
}

func (n *Navigation) FromEntity(record entity.Navigation) {
	n.Serial = record.Serial
	n.Code = record.Code
	n.ViewContentSerial = record.ViewContent.Serial
	n.Title = record.Title
	n.Description = record.Description
	n.URL = record.URL
	n.NavigationLevel = record.NavigationLevel
	n.Path = record.Path
}
