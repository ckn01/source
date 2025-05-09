package entity

import "errors"

var (
	ErrSerialIsRequired = errors.New("serial is required")
	ErrRecordNotFound   = errors.New("record is not found")
)
