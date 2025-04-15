package module

import (
	"os"
	"strings"

	"github.com/fetchlydev/source/fetchly-ai/config"
	"github.com/fetchlydev/source/fetchly-ai/pkg/helper"
)

type RAGUsecase interface {
	ChunkTextIntoSlice(text string) (chunkText []string, err error)
}

type ragUsecase struct {
	cfg config.Config
}

func NewRAGUsecase(cfg config.Config) RAGUsecase {
	return &ragUsecase{
		cfg: cfg,
	}
}

func (uc *ragUsecase) ChunkTextIntoSlice(text string) (chunkText []string, err error) {
	if text == "" {
		pdfPath := uc.cfg.PDFPath

		content, err := os.ReadFile(pdfPath)
		if err != nil {
			return chunkText, err
		}

		text = string(content)
	}

	keywords := strings.Split(uc.cfg.PDFChunkingKeyword, ",")
	chunkText = helper.ChunkByKeywords(text, keywords)

	return chunkText, nil
}
