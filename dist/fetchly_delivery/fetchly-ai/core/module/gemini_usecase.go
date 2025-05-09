package module

import (
	"context"
	"fmt"
	"math"
	"sort"
	"strings"

	"github.com/fetchlydev/source/fetchly-ai/config"
	"github.com/fetchlydev/source/fetchly-ai/core/entity"

	"log"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type GeminiUsecase interface {
	StartSession(ctx context.Context, chatHistory []genai.Content) (session *genai.ChatSession)
	ResponseString(res *genai.GenerateContentResponse) (string, error)
	FindRelevantDataSet(ctx context.Context, userQuestion string, datasets []entity.DataSet) ([]entity.RankedDataSet, error)
	GetEmbeddingModel() *genai.EmbeddingModel
}

type geminiUsecase struct {
	cfg            config.Config
	model          *genai.GenerativeModel
	embeddingModel *genai.EmbeddingModel
}

func NewGeminiUsecase(cfg config.Config) GeminiUsecase {
	ctx := context.Background()

	client, err := genai.NewClient(ctx, option.WithAPIKey(cfg.GeminiAPIKey))
	if err != nil {
		log.Fatalf("Error creating client: %v", err)
	}
	// defer client.Close()

	model := client.GenerativeModel(cfg.AIChatbotModel)
	model.SetTemperature(cfg.AITemperature)
	model.SetMaxOutputTokens(cfg.AIMaxOutputTokens)
	model.SetTopK(cfg.AITopK)
	model.SetTopP(cfg.AITopP)
	model.ResponseMIMEType = "text/plain"

	embeddingModel := client.EmbeddingModel("text-embedding-004")

	return &geminiUsecase{
		cfg:            cfg,
		model:          model,
		embeddingModel: embeddingModel,
	}
}

func (uc *geminiUsecase) GetEmbeddingModel() *genai.EmbeddingModel {
	return uc.embeddingModel
}

func (uc *geminiUsecase) StartSession(ctx context.Context, chatHistory []genai.Content) (session *genai.ChatSession) {
	session = uc.model.StartChat()
	session.History = []*genai.Content{}

	if len(chatHistory) > 0 {
		for _, content := range chatHistory {
			session.History = append(session.History, &content)
		}
	}

	return session
}

func (uc *geminiUsecase) ResponseString(res *genai.GenerateContentResponse) (string, error) {
	// Only taking the first candidate since GenerationConfig.CandidateCount defaults to 1.
	if len(res.Candidates) > 0 {
		if cs := uc.ContentString(res.Candidates[0].Content); cs != nil {
			return *cs, nil
		}
	}

	return "", fmt.Errorf("invalid response from Gemini model")
}

func (uc *geminiUsecase) ContentString(c *genai.Content) *string {
	if c == nil || c.Parts == nil {
		return nil
	}

	cStrs := make([]string, len(c.Parts))
	for i, part := range c.Parts {
		if pt, ok := part.(genai.Text); ok {
			cStrs[i] = string(pt)
		} else {
			return nil
		}
	}

	cStr := strings.Join(cStrs, "\n")
	return &cStr
}

func (g *geminiUsecase) FindRelevantDataSet(ctx context.Context, userQuestion string, datasets []entity.DataSet) ([]entity.RankedDataSet, error) {
	userEmbedding, err := g.embeddingModel.EmbedContent(ctx, genai.Text(userQuestion))
	if err != nil {
		return nil, fmt.Errorf("embedding user question: %w", err)
	}

	rankedDataSets := make([]entity.RankedDataSet, len(datasets))
	for i, dataset := range datasets {
		faqEmbedding, err := g.embeddingModel.EmbedContent(ctx, genai.Text(dataset.Question))
		if err != nil {
			return nil, fmt.Errorf("embedding FAQ question: %w", err)
		}

		similarity := cosineSimilarity(userEmbedding.Embedding.Values, faqEmbedding.Embedding.Values)
		rankedDataSets[i] = entity.RankedDataSet{
			DataSet:    dataset,
			Similarity: similarity,
		}
	}

	// Sort FAQs by similarity in descending order
	sort.Slice(rankedDataSets, func(i, j int) bool {
		return rankedDataSets[i].Similarity > rankedDataSets[j].Similarity
	})

	return rankedDataSets, nil
}

// cosineSimilarity calculates the cosine similarity between two vectors.
func cosineSimilarity(v1, v2 []float32) float64 {
	if len(v1) != len(v2) {
		panic("vectors must have the same length") // Or handle this error differently
	}

	dotProduct := 0.0
	magnitude1 := 0.0
	magnitude2 := 0.0

	for i := range v1 {
		dotProduct += float64(v1[i]) * float64(v2[i])
		magnitude1 += float64(v1[i]) * float64(v1[i])
		magnitude2 += float64(v2[i]) * float64(v2[i])
	}

	if magnitude1 == 0 || magnitude2 == 0 {
		return 0.0 // Handle cases where one or both vectors are zero
	}

	return dotProduct / (math.Sqrt(magnitude1) * math.Sqrt(magnitude2))
}
