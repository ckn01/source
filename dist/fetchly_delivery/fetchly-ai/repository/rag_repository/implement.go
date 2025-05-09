package ragrepository

import (
	"context"
	"fmt"
	"strings"

	"github.com/fetchlydev/source/fetchly-ai/config"
	"github.com/fetchlydev/source/fetchly-ai/core/entity"
	repository_intf "github.com/fetchlydev/source/fetchly-ai/core/repository"
	"gorm.io/gorm"
)

type repository struct {
	cfg config.Config
	db  *gorm.DB
}

func New(cfg config.Config, db *gorm.DB) repository_intf.RAGRepository {
	return &repository{
		cfg: cfg,
		db:  db,
	}
}

func (r *repository) GetDocumentBySerial(ctx context.Context, serial string) (record entity.Documents, err error) {
	db := r.db.Model(&Documents{})

	if serial == "" {
		return record, entity.ErrSerialIsRequired
	}

	result := Documents{}
	if err := db.First(&result).Error; err != nil {
		return record, entity.ErrRecordNotFound
	}

	return result.ToEntity(), nil
}

func (r *repository) CreateNewEmbeddingDocument(ctx context.Context, documentRecord entity.Documents) (response entity.Documents, err error) {
	db := r.db.Model(&Documents{})

	newRecord := Documents{}
	newRecord.FromEntity(documentRecord)

	if err := db.Create(&newRecord).Error; err != nil {
		return response, err
	}

	response, err = r.GetDocumentBySerial(ctx, newRecord.Serial)
	if err != nil {
		return response, err
	}

	return response, nil
}

func (r *repository) FindMostSimilarDocuments(ctx context.Context, embedding []float32, limit int32) (topRecords []entity.Documents, err error) {
	db := r.db

	if r.cfg.IsDebugMode {
		db.Debug()
	}

	var results []Documents
	query := `
	SELECT *, embedding <=> $1::vector AS distance
	FROM fetchly_ai.documents
	ORDER BY distance
	LIMIT $2
	`

	var sb strings.Builder
	sb.WriteString("[")

	strEmb := make([]string, len(embedding))
	for i, emb := range embedding {
		strEmb[i] = fmt.Sprintf("%v", emb)
	}
	sb.WriteString(strings.Join(strEmb, ","))
	sb.WriteString("]")

	embeddingString := sb.String()

	if err := db.Raw(query, embeddingString, limit).Scan(&results).Error; err != nil {
		return nil, err
	}

	for _, result := range results {
		topRecords = append(topRecords, result.ToEntity())
	}

	return topRecords, nil
}
