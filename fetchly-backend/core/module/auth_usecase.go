package module

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/pbkdf2"

	"github.com/fetchlydev/source/fetchly-backend/config"
	"github.com/fetchlydev/source/fetchly-backend/core/entity"
	"github.com/fetchlydev/source/fetchly-backend/core/repository"
)

type AuthUsecase interface {
	Login(ctx context.Context, request entity.LoginRequest) (resp entity.LoginResponse, err error)
	RefreshToken(ctx context.Context, tenantCode, refreshToken string) (resp entity.RefreshTokenResponse, err error)
	EncryptPassword(ctx context.Context, tenantCode, plainPwd string) (cipherTextB64, saltB64, ivB64 string, err error)
	GetCurrentUser(ctx context.Context, tenantCode, accessToken string) (resp map[string]any, err error)
	GoogleLogin(ctx context.Context, tenantCode, productCode, credential string) (resp entity.GoogleLoginResponse, err error)
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

func (uc *authUsecase) RefreshToken(ctx context.Context, tenantCode, refreshToken string) (resp entity.RefreshTokenResponse, err error) {
	token, err := jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		if method, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("signing method invalid")
		} else if method != entity.JWT_SIGNING_METHOD {
			return nil, fmt.Errorf("signing method invalid")
		}

		return []byte(GetJWTSecret(tenantCode)), nil
	})
	if err != nil {
		return resp, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return resp, fmt.Errorf("token invalid")
	}

	// Ensure claims contain the user data and check if the token is valid
	user, ok := claims["user"].(map[string]any)
	if !ok {
		return resp, fmt.Errorf("invalid user claims")
	}

	// Generate a new token and refresh token
	newToken, err := GenerateJWT(user, tenantCode)
	if err != nil {
		return resp, err
	}

	// Generate a new refresh token (can reuse the same logic)
	newRefreshToken, err := GenerateJWT(user, tenantCode)
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

func GenerateJWT[T entity.JWTUserData](user T, tenantCode string) (string, error) {
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

func (uc *authUsecase) GetCurrentUser(ctx context.Context, tenantCode, accessToken string) (resp map[string]any, err error) {
	token, err := jwt.Parse(accessToken, func(token *jwt.Token) (interface{}, error) {
		if method, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("signing method invalid")
		} else if method != entity.JWT_SIGNING_METHOD {
			return nil, fmt.Errorf("signing method invalid")
		}

		return []byte(GetJWTSecret(tenantCode)), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("token invalid")
	}

	user, ok := claims["user"]
	if !ok {
		return nil, fmt.Errorf("user field not found in claims")
	}

	userMap, ok := user.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("user field is not a map")
	}

	return userMap, nil
}

func (uc *authUsecase) GoogleLogin(ctx context.Context, tenantCode, productCode, credential string) (resp entity.GoogleLoginResponse, err error) {
	// First, get the token header without verification to extract the key ID
	segments := strings.Split(credential, ".")
	if len(segments) != 3 {
		return resp, fmt.Errorf("invalid token format")
	}

	headerJSON, err := base64.RawURLEncoding.DecodeString(segments[0])
	if err != nil {
		return resp, fmt.Errorf("failed to decode token header: %v", err)
	}

	var header struct {
		Kid string `json:"kid"`
		Alg string `json:"alg"`
	}
	if err := json.Unmarshal(headerJSON, &header); err != nil {
		return resp, fmt.Errorf("failed to parse token header: %v", err)
	}

	if header.Kid == "" {
		return resp, fmt.Errorf("kid not found in token header")
	}

	// Fetch Google's public keys
	httpResp, err := http.Get("https://www.googleapis.com/oauth2/v3/certs")
	if err != nil {
		return resp, fmt.Errorf("failed to fetch Google public keys: %v", err)
	}
	defer httpResp.Body.Close()

	var keys struct {
		Keys []struct {
			Kid string `json:"kid"`
			Kty string `json:"kty"`
			Alg string `json:"alg"`
			Use string `json:"use"`
			N   string `json:"n"`
			E   string `json:"e"`
		} `json:"keys"`
	}

	if err := json.NewDecoder(httpResp.Body).Decode(&keys); err != nil {
		return resp, fmt.Errorf("failed to decode Google public keys: %v", err)
	}

	// Find the key that matches the kid
	var publicKey *rsa.PublicKey
	for _, key := range keys.Keys {
		if key.Kid == header.Kid {
			// Convert the modulus and exponent to a public key
			nBytes, err := base64.RawURLEncoding.DecodeString(key.N)
			if err != nil {
				return resp, fmt.Errorf("failed to decode modulus: %v", err)
			}
			eBytes, err := base64.RawURLEncoding.DecodeString(key.E)
			if err != nil {
				return resp, fmt.Errorf("failed to decode exponent: %v", err)
			}

			n := new(big.Int).SetBytes(nBytes)
			e := new(big.Int).SetBytes(eBytes).Int64()

			publicKey = &rsa.PublicKey{
				N: n,
				E: int(e),
			}
			break
		}
	}

	if publicKey == nil {
		return resp, fmt.Errorf("no matching public key found")
	}

	// Now verify the token with the public key
	token, err := jwt.Parse(credential, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return publicKey, nil
	})
	if err != nil {
		return resp, fmt.Errorf("invalid token: %v", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return resp, fmt.Errorf("invalid token claims")
	}

	// Extract user information from Google token
	email, ok := claims["email"].(string)
	if !ok {
		return resp, fmt.Errorf("email not found in token")
	}

	name, _ := claims["name"].(string)
	picture, _ := claims["picture"].(string)
	sub, _ := claims["sub"].(string)

	// Check if user exists
	result, err := uc.catalogRepo.GetObjectData(ctx, entity.CatalogQuery{
		TenantCode: tenantCode,
		ObjectCode: "user",
		Filters: []entity.FilterGroup{
			{
				Operator: entity.NewFilterGroupOperator(entity.FilterOperatorOr),
				Filters: map[string]entity.FilterItem{
					"email": {Operator: entity.FilterOperatorEqual, Value: email, FieldName: "email"},
				},
			},
		},
	})
	if err != nil {
		return resp, err
	}

	var user map[string]entity.DataItem
	if len(result.Items) == 0 {
		// Create new user
		items := []entity.DataItem{
			{FieldCode: "email", Value: email},
			{FieldCode: "name", Value: name},
			{FieldCode: "profile_picture", Value: picture},
			{FieldCode: "google_id", Value: sub},
		}

		// Create user in database
		_, err := uc.catalogRepo.CreateObjectData(ctx, entity.DataMutationRequest{
			TenantCode:  tenantCode,
			ObjectCode:  "user",
			ProductCode: productCode,
			Items:       items,
		})
		if err != nil {
			return resp, fmt.Errorf("failed to create user: %v", err)
		}

		// Fetch the newly created user
		result, err = uc.catalogRepo.GetObjectData(ctx, entity.CatalogQuery{
			TenantCode: tenantCode,
			ObjectCode: "user",
			Filters: []entity.FilterGroup{
				{
					Operator: entity.NewFilterGroupOperator(entity.FilterOperatorOr),
					Filters: map[string]entity.FilterItem{
						"email": {Operator: entity.FilterOperatorEqual, Value: email, FieldName: "email"},
					},
				},
			},
		})
		if err != nil {
			return resp, fmt.Errorf("failed to fetch created user: %v", err)
		}

		if len(result.Items) == 0 {
			return resp, fmt.Errorf("user was created but could not be fetched")
		}

		user = result.Items[0]
	} else {
		user = result.Items[0]
	}

	// Generate JWT token
	jwtToken, err := GenerateJWT(user, tenantCode)
	if err != nil {
		return resp, err
	}

	resp.Token = jwtToken

	// Generate refresh token
	excludedFields := []string{"password_cipher", "password_salt", "password_iv", "created_at", "updated_at", "deleted_at", "created_by", "updated_by", "deleted_by"}
	simplifiedUser := make(map[string]entity.DataItem)
	for k, v := range user {
		if !stringInSlice(k, excludedFields) {
			simplifiedUser[k] = v
		}
	}

	refreshToken, err := GenerateJWT(simplifiedUser, tenantCode)
	if err != nil {
		return resp, err
	}

	resp.RefreshToken = refreshToken
	resp.User = simplifiedUser

	return resp, nil
}
