package api

import (
	"log"
	"net/http"

	"github.com/cerkas/cerkas-backend/config"
	"github.com/cerkas/cerkas-backend/core/entity"
	"github.com/cerkas/cerkas-backend/core/module"
	"github.com/cerkas/cerkas-backend/pkg/helper"
	"github.com/gin-gonic/gin"
)

type HTTPHandler interface {
	GetObjectData(c *gin.Context)
	GetObjectDetail(c *gin.Context)
	GetDataByRawQuery(c *gin.Context)
	GetContentLayoutByKeys(c *gin.Context)
	CreateObjectData(c *gin.Context)
}

type httpHandler struct {
	cfg       config.Config
	catalogUc module.CatalogUsecase
	viewUc    module.ViewUsecase
}

func NewHTTPHandler(cfg config.Config, catalogUc module.CatalogUsecase, viewUc module.ViewUsecase) HTTPHandler {
	return &httpHandler{
		cfg:       cfg,
		catalogUc: catalogUc,
		viewUc:    viewUc,
	}
}

func (h *httpHandler) GetObjectData(c *gin.Context) {
	var statusCode int32 = entity.DefaultSucessCode
	var statusMessage string = entity.DefaultSuccessMessage

	request := entity.CatalogQuery{}
	if err := c.ShouldBindJSON(&request); err != nil {
		statusCode = http.StatusBadRequest
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, statusCode, statusMessage, nil)
		return
	}

	response, err := h.catalogUc.GetObjectData(c, request)
	if err != nil {
		statusCode = http.StatusInternalServerError
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, int32(statusCode), statusMessage, nil)
		return
	}

	helper.ResponseOutput(c, int32(statusCode), statusMessage, response)
}

func (h *httpHandler) GetObjectDetail(c *gin.Context) {
	var statusCode int32 = entity.DefaultSucessCode
	var statusMessage string = entity.DefaultSuccessMessage

	serial := c.Param("serial")
	objectCode := c.Param("object_code")
	tenantCode := c.Param("tenant_code")
	productCode := c.Param("product_code")

	if serial == "" {
		statusCode = http.StatusBadRequest
		statusMessage = entity.ErrorSerialEmpty.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, statusCode, statusMessage, nil)
		return
	}

	request := entity.CatalogQuery{}
	if err := c.ShouldBindJSON(&request); err != nil {
		statusCode = http.StatusBadRequest
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, statusCode, statusMessage, nil)
		return
	}

	request.Serial = serial

	if tenantCode != "" {
		request.TenantCode = tenantCode
	}

	if productCode != "" {
		request.ProductCode = productCode
	}

	if objectCode != "" {
		request.ObjectCode = objectCode
	}

	response, err := h.catalogUc.GetObjectDetail(c, request, serial)
	if err != nil {
		statusCode = http.StatusInternalServerError
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, int32(statusCode), statusMessage, nil)
		return
	}

	helper.ResponseOutput(c, int32(statusCode), statusMessage, response)
}

func (h *httpHandler) GetDataByRawQuery(c *gin.Context) {
	var statusCode int32 = entity.DefaultSucessCode
	var statusMessage string = entity.DefaultSuccessMessage

	request := entity.CatalogQuery{}
	if err := c.ShouldBindJSON(&request); err != nil {
		statusCode = http.StatusBadRequest
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, statusCode, statusMessage, nil)
		return
	}

	response, err := h.catalogUc.GetDataByRawQuery(c, request)
	if err != nil {
		statusCode = http.StatusInternalServerError
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, int32(statusCode), statusMessage, nil)
		return
	}

	helper.ResponseOutput(c, int32(statusCode), statusMessage, response)
}

func (h *httpHandler) GetContentLayoutByKeys(c *gin.Context) {
	var statusCode int32 = entity.DefaultSucessCode
	var statusMessage string = entity.DefaultSuccessMessage

	request := entity.GetViewContentByKeysRequest{}

	request.TenantCode = c.Param("tenant_code")
	request.ProductCode = c.Param("product_code")
	request.ObjectCode = c.Param("object_code")
	request.ViewContentCode = c.Param("view_content_code")
	request.LayoutType = c.Param("layout_type")

	catalogQuery := entity.CatalogQuery{
		TenantCode:      request.TenantCode,
		ProductCode:     request.ProductCode,
		ObjectCode:      request.ObjectCode,
		ViewContentCode: request.ViewContentCode,
	}

	response, err := h.viewUc.GetContentLayoutByKeys(c, request, catalogQuery)
	if err != nil {
		statusCode = http.StatusInternalServerError
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, int32(statusCode), statusMessage, nil)
		return
	}

	helper.ResponseOutput(c, int32(statusCode), statusMessage, response)
}

func (h *httpHandler) CreateObjectData(c *gin.Context) {
	var statusCode int32 = entity.DefaultSucessCode
	var statusMessage string = entity.DefaultSuccessMessage
	var defaultUserSerial string = "system"

	request := entity.DataMutationRequest{}
	if err := c.ShouldBindJSON(&request); err != nil {
		statusCode = http.StatusBadRequest
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, statusCode, statusMessage, nil)
		return
	}

	request.UserSerial = defaultUserSerial

	response, err := h.catalogUc.CreateObjectData(c, request)
	if err != nil {
		statusCode = http.StatusInternalServerError
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, int32(statusCode), statusMessage, nil)
		return
	}

	helper.ResponseOutput(c, int32(statusCode), statusMessage, response)
}
