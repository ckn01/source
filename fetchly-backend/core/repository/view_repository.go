package repository

import (
	"context"

	"github.com/fetchlydev/source/fetchly-backend/core/entity"
)

type ViewRepository interface {
	GetViewContentByKeys(ctx context.Context, request entity.GetViewContentByKeysRequest) (resp map[string]entity.DataItem, err error)
	GetNavigationByViewContentSerial(ctx context.Context, request entity.GetNavigationItemByViewContentSerialRequest) (resp []entity.Navigation, err error)
}
