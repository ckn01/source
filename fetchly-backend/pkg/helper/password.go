package helper

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
)

// EncryptPassword encrypts a password using AES-GCM with a given key
func EncryptPassword(password, key string) (string, error) {
	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		return "", err
	}

	nonce := make([]byte, 12) // GCM standard nonce size
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	encrypted := aesGCM.Seal(nil, nonce, []byte(password), nil)
	result := append(nonce, encrypted...)

	return base64.StdEncoding.EncodeToString(result), nil
}

// DecryptPassword decrypts an AES-GCM encrypted password using the same key
func DecryptPassword(encodedText, key string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(encodedText)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		return "", err
	}

	if len(data) < 12 {
		return "", fmt.Errorf("invalid encrypted data")
	}

	nonce := data[:12]
	ciphertext := data[12:]

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	decrypted, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(decrypted), nil
}
