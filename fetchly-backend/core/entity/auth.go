package entity

import (
	"errors"
)

const (
	AppSecret               = "%v-fetchly-backend-secret-key"     // keep this safe and private
	JWTSecret               = "%v-fetchly-backend-jwt-secret-key" // keep this safe and private
	Pbkdf2Iterations        = 100_000
	KeySize                 = 32 // 32 bytes = 256 bits
	SaltSize                = 16
	IvSize                  = 12 // for AES-GCM
	DefaultTokenExpiredHour = 24 // 1 day
)

var (
	ErrUserNotFound         = errors.New("user not found")
	ErrInvalidUsername      = errors.New("invalid username")
	ErrInvalidPassword      = errors.New("invalid password")
	ErrInvalidTenantSerial  = errors.New("invalid tenant serial")
	ErrInvalidProductSerial = errors.New("invalid product serial")
)

type EncryptPasswordRequest struct {
	TenantCode    string `json:"tenant_code"`
	PlainPassword string `json:"plain_password"`
}

type EncryptPasswordResponse struct {
	CipherText string `json:"cipher_text"`
	Salt       string `json:"salt"`
	Iv         string `json:"iv"`
}

type LoginRequest struct {
	Username    string `json:"username"`
	Password    string `json:"password"`
	TenantCode  string `json:"tenant_code"`
	ProductCode string `json:"product_code"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type LoginResponse struct {
	Token         string              `json:"token"`
	RefreshToken  string              `json:"refresh_token"`
	User          map[string]DataItem `json:"user"`
	TenantSerial  string              `json:"tenant_serial"`
	ProductSerial string              `json:"product_serial"`
}

type RefreshTokenResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
}
