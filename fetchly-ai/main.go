package main

import (
	"fmt"
	"log"

	"github.com/fetchlydev/source/fetchly-ai/config"
	"github.com/fetchlydev/source/fetchly-ai/handler/middleware"
	"github.com/fetchlydev/source/fetchly-ai/pkg/conn"
)

func main() {
	log.Printf("initialate fetchly-ai service")

	cfg := config.Get()

	db := conn.InitDB(&cfg)
	defer conn.DbClose(db)

	router, _ := middleware.InitRouter(cfg, db)
	if err := router.Run(":" + cfg.HTTPPort); err != nil {
		panic(fmt.Errorf("failed to start server: %s", err.Error()))
	}
}
