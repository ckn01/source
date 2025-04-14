package helper

import (
	"fmt"
	"regexp"

	"github.com/gofrs/uuid"
)

func GenerateUUUID() (string, error) {
	u, err := uuid.NewV4()
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%v", u), nil
}

func IsUUID(s string) bool {
	uuidRegex := `^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$`
	re := regexp.MustCompile(uuidRegex)
	return re.MatchString(s)
}
