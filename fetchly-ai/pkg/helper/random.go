package helper

import (
	"crypto/md5"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
)

func GeneratePasswordString(bahan string) (string, error) {
	hasher := md5.New()
	hasher.Write([]byte(bahan))
	return hex.EncodeToString(hasher.Sum(nil)), nil
}

func GenerateNomorPendaftaranRandom(bahan string) (string, error) {
	hasher := md5.New()
	hasher.Write([]byte(bahan))
	return strings.ToUpper(hex.EncodeToString(hasher.Sum(nil))[:12]), nil
}

func GenerateNomorPendaftaranByKodeWilayah(bahan, kodeWilayah, jenjang string, penerapanID int32) (string, error) {
	hasher := md5.New()
	hasher.Write([]byte(bahan))
	randomString := strings.ToUpper(hex.EncodeToString(hasher.Sum(nil))[:6])

	return fmt.Sprintf("%v%v%v-%v", jenjang, penerapanID, kodeWilayah, randomString), nil
}

func GenerateSerial(length int) string {
	var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
	lenChar := len(chars)
	b := make([]byte, length)
	rand.Read(b)
	for i := 0; i < length; i++ {
		b[i] = chars[int(b[i])%lenChar]
	}
	return string(b)
}
