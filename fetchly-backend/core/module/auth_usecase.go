package module

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/pbkdf2"

	"github.com/fetchlydev/source/fetchly-backend/config"
	"github.com/fetchlydev/source/fetchly-backend/core/entity"
	"github.com/fetchlydev/source/fetchly-backend/core/repository"
)

type AuthUsecase interface {
	Login(ctx context.Context, request entity.LoginRequest) (resp entity.LoginResponse, err error)
	RefreshToken(ctx context.Context, refreshToken string) (resp entity.RefreshTokenResponse, err error)
	EncryptPassword(ctx context.Context, tenantCode, plainPwd string) (cipherTextB64, saltB64, ivB64 string, err error)
}

type authUsecase struct {
	cfg         config.Config
	authRepo    repository.AuthRepository
	catalogRepo repository.CatalogRepository
}

func NewAuthUsecase(cfg config.Config, authRepo repository.AuthRepository, catalogRepo repository.CatalogRepository) AuthUsecase {
	return &authUsecase{
		cfg:         cfg,
		authRepo:    authRepo,
		catalogRepo: catalogRepo,
	}
}

func (uc *authUsecase) Login(ctx context.Context, request entity.LoginRequest) (resp entity.LoginResponse, err error) {
	// Validate the request
	if err := validateLoginRequest(request); err != nil {
		return resp, err
	}

	result, err := uc.catalogRepo.GetObjectData(ctx, entity.CatalogQuery{
		TenantCode: request.TenantCode,
		ObjectCode: "user",
		Filters: []entity.FilterGroup{
			{
				Operator: entity.NewFilterGroupOperator(entity.FilterOperatorOr),
				Filters: map[string]entity.FilterItem{
					"username":     {Operator: entity.FilterOperatorEqual, Value: request.Username, FieldName: "username"},
					"email":        {Operator: entity.FilterOperatorEqual, Value: request.Username, FieldName: "email"},
					"phone_number": {Operator: entity.FilterOperatorEqual, Value: request.Username, FieldName: "phone_number"},
				},
			},
		},
	})
	if err != nil {
		return resp, err
	}

	if len(result.Items) == 0 {
		return resp, entity.ErrUserNotFound
	}

	user := result.Items[0]

	// Decrypt the password
	chiperText := user["password_cipher"].Value.(string)
	salt := user["password_salt"].Value.(string)
	iv := user["password_iv"].Value.(string)
	appSecret := GetAppSecret(request.TenantCode)

	plainPwd, err := DecryptPassword(chiperText, salt, iv, appSecret)
	if err != nil {
		return resp, entity.ErrInvalidPassword
	}

	if plainPwd != request.Password {
		return resp, entity.ErrInvalidPassword
	}

	// Generate JWT token
	token, err := GenerateJWT(user, request.TenantCode)
	if err != nil {
		return resp, err
	}

	resp.Token = token

	exlucdedFields := []string{"password_cipher", "password_salt", "password_iv", "created_at", "updated_at", "deleted_at", "created_by", "updated_by", "deleted_by"}

	simplifiedUser := make(map[string]entity.DataItem)
	for k, v := range user {
		// Skip excluded fields
		if !stringInSlice(k, exlucdedFields) {
			simplifiedUser[k] = v
		}
	}

	// generate refresh token
	refreshToken, err := GenerateJWT(simplifiedUser, request.TenantCode)
	if err != nil {
		return resp, err
	}

	resp.RefreshToken = refreshToken
	resp.User = simplifiedUser

	return
}

func (uc *authUsecase) RefreshToken(ctx context.Context, refreshToken string) (resp entity.RefreshTokenResponse, err error) {
	// Declare a MapClaims object to hold the claims
	var claims jwt.MapClaims

	// Validate the refresh token and parse claims
	_, err = jwt.ParseWithClaims(refreshToken, &claims, func(token *jwt.Token) (interface{}, error) {
		// Check if the signing method is HMAC
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		// Access tenant code from claims
		tenantCode, ok := claims["tenant_code"].(string)
		if !ok {
			return nil, fmt.Errorf("tenant code not found in token claims")
		}

		// Return the secret for the tenant code
		return []byte(GetJWTSecret(tenantCode)), nil
	})
	if err != nil {
		return resp, err
	}

	// Ensure claims contain the user data and check if the token is valid
	user, ok := claims["user"].(map[string]entity.DataItem)
	if !ok {
		return resp, fmt.Errorf("invalid user claims")
	}

	// Generate a new token and refresh token
	newToken, err := GenerateJWT(user, claims["tenant_code"].(string))
	if err != nil {
		return resp, err
	}

	// Generate a new refresh token (can reuse the same logic)
	newRefreshToken, err := GenerateJWT(user, claims["tenant_code"].(string))
	if err != nil {
		return resp, err
	}

	// Return the new tokens
	return entity.RefreshTokenResponse{
		Token:        newToken,
		RefreshToken: newRefreshToken,
	}, nil
}

func (uc *authUsecase) EncryptPassword(ctx context.Context, tenantCode, plainPwd string) (cipherTextB64, saltB64, ivB64 string, err error) {
	appSecret := GetAppSecret(tenantCode)

	return EncryptPassword(plainPwd, appSecret)
}

func GetAppSecret(tenantCode string) string {
	return fmt.Sprintf(entity.AppSecret, tenantCode)
}

func GetJWTSecret(tenantCode string) string {
	return fmt.Sprintf(entity.JWTSecret, tenantCode)
}

func GenerateJWT(user map[string]entity.DataItem, tenantCode string) (string, error) {
	claims := jwt.MapClaims{
		"user":        user,
		"tenant_code": tenantCode,
		"exp":         time.Now().Add(entity.DefaultTokenExpiredHour * time.Hour).Unix(),
		"iat":         time.Now().Unix(),
	}

	// Ensure the JWT secret is a byte slice (not a string)
	secret := []byte(GetJWTSecret(tenantCode))

	// Create the token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token with the byte slice secret
	return token.SignedString(secret)
}

func validateLoginRequest(request entity.LoginRequest) error {
	// Perform validation on the request fields
	if request.Username == "" {
		return entity.ErrInvalidUsername
	}
	if request.Password == "" {
		return entity.ErrInvalidPassword
	}
	if request.TenantCode == "" {
		return entity.ErrInvalidTenantSerial
	}
	if request.ProductCode == "" {
		return entity.ErrInvalidProductSerial
	}

	return nil
}

// Generates a random byte slice
func GenerateRandomBytes(size int) ([]byte, error) {
	bytes := make([]byte, size)
	_, err := rand.Read(bytes)
	return bytes, err
}

// Encrypts a plain password
func EncryptPassword(plainPwd, appSecret string) (cipherTextB64, saltB64, ivB64 string, err error) {
	salt, err := GenerateRandomBytes(entity.SaltSize)
	if err != nil {
		return
	}

	if appSecret == "" {
		appSecret = entity.AppSecret
	}

	key := pbkdf2.Key([]byte(appSecret), salt, entity.Pbkdf2Iterations, entity.KeySize, sha256.New)

	iv, err := GenerateRandomBytes(entity.IvSize)
	if err != nil {
		return
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return
	}

	cipherText := aesGCM.Seal(nil, iv, []byte(plainPwd), nil)

	// Encode everything to base64 for DB storage
	cipherTextB64 = base64.StdEncoding.EncodeToString(cipherText)
	saltB64 = base64.StdEncoding.EncodeToString(salt)
	ivB64 = base64.StdEncoding.EncodeToString(iv)
	return
}

func DecryptPassword(cipherTextB64, saltB64, ivB64, appSecret string) (string, error) {
	cipherText, _ := base64.StdEncoding.DecodeString(cipherTextB64)
	salt, _ := base64.StdEncoding.DecodeString(saltB64)
	iv, _ := base64.StdEncoding.DecodeString(ivB64)

	if appSecret == "" {
		appSecret = entity.AppSecret
	}

	key := pbkdf2.Key([]byte(appSecret), salt, entity.Pbkdf2Iterations, entity.KeySize, sha256.New)

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	plainPwd, err := aesGCM.Open(nil, iv, cipherText, nil)
	if err != nil {
		return "", err
	}

	return string(plainPwd), nil
}

func stringInSlice(str string, slice []string) bool {
	for _, s := range slice {
		if s == str {
			return true
		}
	}
	return false
}
