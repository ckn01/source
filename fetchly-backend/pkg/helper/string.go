package helper

import "strings"

func Contains(s []string, str string) bool {
	for _, v := range s {
		if v == str {
			return true
		}
	}

	return false
}

func ReplaceUnderscoreWithSpace(str string) string {
	return strings.ReplaceAll(str, "_", " ")
}

func CapitalizeWords(input string) string {
	// Split string menjadi slice berdasarkan spasi
	words := strings.Fields(input)

	for i, word := range words {
		if len(word) > 0 {
			// Ubah huruf pertama menjadi kapital dan gabungkan dengan sisanya
			words[i] = strings.ToUpper(string(word[0])) + strings.ToLower(word[1:])
		}
	}

	// Gabungkan kembali slice menjadi string
	return strings.Join(words, " ")
}

// Converts snake_case to CamelCase
func SnakeToCamel(s string) string {
	parts := strings.Split(s, "_")
	for i := range parts {
		parts[i] = strings.Title(parts[i]) // Capitalize each part
	}
	return strings.Join(parts, "")
}

// Converts CamelCase to snake_case
func CamelToSnake(s string) string {
	var result strings.Builder
	for i, r := range s {
		if i > 0 && r >= 'A' && r <= 'Z' {
			result.WriteRune('_')
		}
		result.WriteRune(r)
	}
	return strings.ToLower(result.String())
}
