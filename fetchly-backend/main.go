package main

import (
	"fmt"
	"log"

	"github.com/cerkas/cerkas-backend/config"
	"github.com/cerkas/cerkas-backend/handler/middleware"
	"github.com/cerkas/cerkas-backend/pkg/conn"
)

func main() {
	log.Printf("initialate cerkas-backend")

	cfg := config.Get()

	db := conn.InitDB(&cfg)
	defer conn.DbClose(db)

	router, _ := middleware.InitRouter(cfg, db)
	if err := router.Run(":" + cfg.HTTPPort); err != nil {
		panic(fmt.Errorf("failed to start server: %s", err.Error()))
	}
}
