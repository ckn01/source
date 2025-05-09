package repository

import (
	"context"

	"github.com/fetchlydev/source/fetchly-backend/core/entity"
)

type AuthRepository interface {
	Login(ctx context.Context, request entity.LoginRequest) (resp entity.LoginResponse, err error)
	Logout(ctx context.Context) error
	RefreshToken(ctx context.Context, refreshToken string) (string, error)
	GetCurrentUser(ctx context.Context) (string, error)
	GetUserBySerial(ctx context.Context, userID string) (string, error)
}
