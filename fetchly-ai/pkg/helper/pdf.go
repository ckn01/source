package helper

import (
	"fmt"
	"regexp"
	"strings"

	"rsc.io/pdf"
)

func ExtractTextFromPDF(path string) (string, error) {
	r, err := pdf.Open(path)
	if err != nil {
		return "", err
	}

	var sb strings.Builder
	numPage := r.NumPage()

	for i := range numPage {
		page := r.Page(i + 1)
		if page.V.IsNull() {
			continue
		}
		content := page.Content()
		for _, text := range content.Text {
			sb.WriteString(text.S)
			sb.WriteString("")
		}
	}

	return sb.String(), nil
}

func ChunkByKeywords(text string, keywords []string) []string {
	// Build regex to match any keyword as a word boundary
	joined := strings.Join(keywords, "|")
	re := regexp.MustCompile(fmt.Sprintf(`(?i)\b(%s)\b`, joined))

	// Find all match positions
	indices := re.FindAllStringIndex(text, -1)

	// If no match, return the whole thing as one chunk
	if len(indices) == 0 {
		return []string{text}
	}

	chunks := []string{}
	start := 0
	for _, idx := range indices {
		if idx[0] > start {
			chunks = append(chunks, strings.TrimSpace(text[start:idx[0]]))
		}
		start = idx[0]
	}
	// Add the final chunk
	if start < len(text) {
		chunks = append(chunks, strings.TrimSpace(text[start:]))
	}

	return chunks
}
