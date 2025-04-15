package main

import (
	"fmt"
	"log"

	"github.com/fetchlydev/source/fetchly-ai/config"
	"github.com/fetchlydev/source/fetchly-ai/core/module"
	"github.com/fetchlydev/source/fetchly-ai/pkg/helper"
)

func main() {
	log.Printf("initialate fetchly-ai service")

	cfg := config.Get()

	ragUc := module.NewRAGUsecase(cfg)

	chunks, err := ragUc.ChunkTextIntoSlice("")
	if err != nil {
		log.Fatal(err)
	}

	for i, chunk := range chunks {
		fmt.Printf("\n--- Chunk %d ---\n%s\n", i+1, chunk[:helper.Min(1000, len(chunk))])
	}
}
