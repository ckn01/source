package module

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/fetchlydev/source/fetchly-ai/config"
	"github.com/fetchlydev/source/fetchly-ai/core/entity"
	"github.com/fetchlydev/source/fetchly-ai/core/repository"
	"github.com/fetchlydev/source/fetchly-ai/pkg/helper"
	"github.com/google/generative-ai-go/genai"
)

type RAGUsecase interface {
	ChunkTextIntoSlice(text string) (chunkText []string, err error)
	EmbedChunkText(ctx context.Context, definedSection string, chunks []string) (resp []entity.Documents, err error)
	GenerateRAGTextAnswer(ctx context.Context, textInput string) (resp string, err error)
}

type ragUsecase struct {
	cfg      config.Config
	geminiUc GeminiUsecase
	ragRepo  repository.RAGRepository
}

func NewRAGUsecase(cfg config.Config, geminiUc GeminiUsecase, ragRepo repository.RAGRepository) RAGUsecase {
	return &ragUsecase{
		cfg:      cfg,
		geminiUc: geminiUc,
		ragRepo:  ragRepo,
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

func (uc *ragUsecase) EmbedChunkText(ctx context.Context, definedSection string, chunks []string) (resp []entity.Documents, err error) {
	for i, chunk := range chunks {
		fmt.Printf("\n--- Chunk %d ---\n%s\n", i+1, chunk[:helper.Min(1000, len(chunk))])

		userEmbedding, _ := uc.geminiUc.GetEmbeddingModel().EmbedContent(ctx, genai.Text(chunk[:helper.Min(1000, len(chunk))]))
		embeddingValues := userEmbedding.Embedding.Values

		embeddingJson, err := json.Marshal(embeddingValues)
		if err != nil {
			log.Printf("failed to marshal embedding: %v", err)
			// handle the error
		}

		fmt.Printf("userEmbedding: %+v", userEmbedding)

		res, err := uc.ragRepo.CreateNewEmbeddingDocument(ctx, entity.Documents{
			Section:   definedSection,
			Content:   chunk,
			Embedding: string(embeddingJson),
		})
		if err != nil {
			return resp, err
		}

		resp = append(resp, res)
	}

	return resp, nil
}

func (uc *ragUsecase) GenerateRAGTextAnswer(ctx context.Context, textInput string) (resp string, err error) {
	// 1. Get embedding of the user input
	embeddingResp, err := uc.geminiUc.GetEmbeddingModel().EmbedContent(ctx, genai.Text(textInput))
	if err != nil {
		return "", fmt.Errorf("failed to get embedding from Gemini: %w", err)
	}

	embedding := embeddingResp.Embedding.Values

	// 2. Search top N most relevant documents from Postgres (using cosine similarity)
	topDocuments, err := uc.ragRepo.FindMostSimilarDocuments(ctx, embedding, 3) // or 5
	if err != nil {
		return "", fmt.Errorf("failed to retrieve similar documents: %w", err)
	}

	// 3. Build prompt context
	var contextBuilder strings.Builder
	for _, doc := range topDocuments {
		contextBuilder.WriteString(doc.Content)
		contextBuilder.WriteString("\n---\n") // optional separator
	}
	combinedContext := contextBuilder.String()

	// 4. Pass it to Gemini along with the user query
	prompt := fmt.Sprintf(`Berikut ini adalah referensi dari Permendikdasmen Nomor 3 tahun 2025:\n\n%s\n\nPertanyaan pengguna: %s\n\nJawaban:`, combinedContext, textInput)

	session := uc.geminiUc.StartSession(ctx, nil)
	genRes, err := session.SendMessage(ctx, genai.Text(prompt))
	if err != nil {
		return "", fmt.Errorf("failed to get answer from Gemini: %w", err)
	}

	// 5. Extract and return the response
	answer, err := uc.geminiUc.ResponseString(genRes)
	if err != nil {
		return "", fmt.Errorf("failed to parse Gemini response: %w", err)
	}

	return answer, nil
}
