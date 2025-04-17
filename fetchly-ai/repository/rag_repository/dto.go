package ragrepository

import (
	"time"

	"github.com/fetchlydev/source/fetchly-ai/core/entity"
	"gorm.io/gorm"
)

type Documents struct {
	ID        int64          `gorm:"column:id;primaryKey" json:"id"`
	Serial    string         `gorm:"column:serial;default:uuid_generate_v4()" json:"serial"`
	CreatedAt time.Time      `gorm:"column:created_at;type:timestamp without time zone;default:now()" json:"created_at"`
	CreatedBy string         `gorm:"column:created_by;type:uuid" json:"created_by"`
	UpdatedAt time.Time      `gorm:"column:updated_at;type:timestamp without time zone;default:now()" json:"updated_at"`
	UpdatedBy string         `gorm:"column:updated_by;type:uuid;default:uuid_generate_v4()" json:"updated_by"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;type:timestamp without time zone;default:null" json:"deleted_at"`
	DeletedBy string         `gorm:"column:deleted_by" json:"deleted_by"`
	Section   string         `gorm:"column:section" json:"section"`
	Content   string         `gorm:"column:content" json:"content"`
	Embedding string         `gorm:"column:embedding" json:"embedding"`
}

func (d *Documents) TableName() string {
	return "fetchly_ai.documents"
}

func (d *Documents) ToEntity() entity.Documents {
	return entity.Documents{
		ID:        d.ID,
		Serial:    d.Serial,
		Section:   d.Section,
		Content:   d.Content,
		Embedding: d.Embedding,
	}
}

func (d *Documents) FromEntity(entityRecord entity.Documents) {
	d.ID = entityRecord.ID
	d.Serial = entityRecord.Serial
	d.Section = entityRecord.Section
	d.Content = entityRecord.Content
	d.Embedding = entityRecord.Embedding
}
