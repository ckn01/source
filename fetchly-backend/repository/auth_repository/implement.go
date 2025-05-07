package authrepository

import (
	"context"

	"github.com/fetchlydev/source/fetchly-backend/config"
	"github.com/fetchlydev/source/fetchly-backend/core/entity"
	repository_intf "github.com/fetchlydev/source/fetchly-backend/core/repository"
	"gorm.io/gorm"
)

type repository struct {
	cfg config.Config
	db  *gorm.DB
}

func New(cfg config.Config, db *gorm.DB) repository_intf.AuthRepository {
	return &repository{
		cfg: cfg,
		db:  db,
	}
}

func (r *repository) Login(ctx context.Context, request entity.LoginRequest) (resp entity.LoginResponse, err error) {
	// Implement login logic here
	return
}

func (r *repository) Logout(ctx context.Context) error {
	// Implement logout logic here
	return nil
}

func (r *repository) RefreshToken(ctx context.Context, refreshToken string) (string, error) {
	// Implement refresh token logic here
	return "", nil
}

func (r *repository) GetCurrentUser(ctx context.Context) (string, error) {
	// Implement get current user logic here
	return "", nil
}

func (r *repository) GetUserBySerial(ctx context.Context, userID string) (string, error) {
	// Implement get user by serial logic here

	return "", nil
}
