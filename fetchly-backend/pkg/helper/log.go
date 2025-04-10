package helper

import (
	"encoding/json"
	"log"
)

func DebugLogJson(data interface{}) (jsonStr string) {
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		log.Printf("Error marshalling data to JSON: %v", err)
		return
	}

	return string(jsonData)
}
