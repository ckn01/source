package repository

import (
	"context"

	"github.com/fetchlydev/source/fetchly-ai/core/entity"
)

type RAGRepository interface {
	GetDocumentBySerial(ctx context.Context, serial string) (record entity.Documents, err error)
	CreateNewEmbeddingDocument(ctx context.Context, documentRecord entity.Documents) (response entity.Documents, err error)
	FindMostSimilarDocuments(ctx context.Context, embedding []float32, limit int32) (topRecords []entity.Documents, err error)
}
