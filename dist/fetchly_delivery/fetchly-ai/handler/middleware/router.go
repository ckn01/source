// fake commit
package middleware

import (
	"strings"

	"github.com/fetchlydev/source/fetchly-ai/config"
	"github.com/fetchlydev/source/fetchly-ai/core/module"
	"github.com/fetchlydev/source/fetchly-ai/handler/api"
	"github.com/fetchlydev/source/fetchly-ai/pkg/conn"
	ragrepository "github.com/fetchlydev/source/fetchly-ai/repository/rag_repository"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func InitRouter(cfg config.Config, db *gorm.DB) (*gin.Engine, conn.CacheService) {
	if strings.EqualFold(cfg.Environment, "production") {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(CORSMiddleware())

	coreRedis, _ := conn.InitRedis(cfg)

	// repository
	ragRepo := ragrepository.New(cfg, db)

	// usecase
	geminiUc := module.NewGeminiUsecase(cfg)
	ragUc := module.NewRAGUsecase(cfg, geminiUc, ragRepo)

	// handler
	httpHandler := api.NewHTTPHandler(cfg, ragUc)

	router.POST("/api/ask", httpHandler.GenerateRAGTextAnswer)

	router.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{"code": "404", "message": "Page not found"})
	})

	return router, coreRedis
}
