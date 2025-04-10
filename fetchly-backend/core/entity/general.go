package entity

import "errors"

var (
	ErrorInternalServerError = errors.New("internal Server Error")
	ErrorNotFound            = errors.New("your requested item is not found")
	ErrorBadRequest          = errors.New("bad request")
	ErrorSerialEmpty         = errors.New("serial is empty")
)

const (
	DefaultSucessCode     int32  = 200
	DefaultSuccessMessage string = "success"
	DefaultDateFormat     string = "2006-01-02"
)
