// fake commit
package middleware

import (
	"strings"

	"github.com/fetchlydev/source/fetchly-backend/config"
	"github.com/fetchlydev/source/fetchly-backend/core/module"
	"github.com/fetchlydev/source/fetchly-backend/handler/api"
	"github.com/fetchlydev/source/fetchly-backend/pkg/conn"
	catalogrepository "github.com/fetchlydev/source/fetchly-backend/repository/catalog_repository"
	viewrepository "github.com/fetchlydev/source/fetchly-backend/repository/view_repository"

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
	catalogRepo := catalogrepository.New(cfg, db)
	viewRepo := viewrepository.New(db, cfg)

	// usecase
	catalogUc := module.NewCatalogUsecase(cfg, catalogRepo, viewRepo)
	viewUc := module.NewViewUsecase(cfg, catalogRepo, viewRepo, catalogUc)

	// handler
	httpHandler := api.NewHTTPHandler(cfg, catalogUc, viewUc)

	t := router.Group("t/:tenant_code")
	{
		t.POST("", httpHandler.GetTenantByCode)

		p := t.Group("p/:product_code")
		{
			p.POST("", httpHandler.GetTenantProductByCode)

			o := p.Group("o/:object_code")
			{
				v := o.Group("view/:view_content_code")
				{
					v.POST("/data", httpHandler.GetObjectData)
					v.POST("/data/raw", httpHandler.GetDataByRawQuery)
					v.POST("/data/detail/:serial", httpHandler.GetObjectDetail)
					v.POST("/:layout_type", httpHandler.GetContentLayoutByKeys)
				}

				o.PUT("/data", httpHandler.CreateObjectData)
				o.PATCH("/data/:serial", httpHandler.UpdateObjectData)
			}
		}
	}

	router.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{"code": "404", "message": "Page not found"})
	})

	return router, coreRedis
}
