package api

import (
	"errors"
	"log"
	"net/http"

	"github.com/fetchlydev/source/fetchly-backend/config"
	"github.com/fetchlydev/source/fetchly-backend/core/entity"
	"github.com/fetchlydev/source/fetchly-backend/core/module"
	"github.com/fetchlydev/source/fetchly-backend/pkg/helper"
	"github.com/gin-gonic/gin"
)

type HTTPHandler interface {
	GetTenantByCode(c *gin.Context)
	GetTenantProductByCode(c *gin.Context)
	GetObjectData(c *gin.Context)
	GetObjectDetail(c *gin.Context)
	GetDataByRawQuery(c *gin.Context)
	GetContentLayoutByKeys(c *gin.Context)
	CreateObjectData(c *gin.Context)
	UpdateObjectData(c *gin.Context)
	Login(c *gin.Context)
	RefreshToken(c *gin.Context)
	EncryptPassword(c *gin.Context)
}

type httpHandler struct {
	cfg       config.Config
	catalogUc module.CatalogUsecase
	viewUc    module.ViewUsecase
	authUc    module.AuthUsecase
}

func NewHTTPHandler(cfg config.Config, catalogUc module.CatalogUsecase, viewUc module.ViewUsecase, authUc module.AuthUsecase) HTTPHandler {
	return &httpHandler{
		cfg:       cfg,
		catalogUc: catalogUc,
		viewUc:    viewUc,
		authUc:    authUc,
	}
}

func (h *httpHandler) GetTenantByCode(c *gin.Context) {
	var statusCode int32 = entity.DefaultSucessCode
	var statusMessage string = entity.DefaultSuccessMessage

	code := c.Param("tenant_code")
	if code == "" {
		statusCode = http.StatusBadRequest
		statusMessage = entity.ErrorSerialEmpty.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, statusCode, statusMessage, nil)
		return
	}

	response, err := h.catalogUc.GetTenantByCode(c, code)
	if err != nil {
		statusCode = http.StatusInternalServerError
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, int32(statusCode), statusMessage, nil)
		return
	}

	helper.ResponseOutput(c, int32(statusCode), statusMessage, response)
}

func (h *httpHandler) GetTenantProductByCode(c *gin.Context) {
	var statusCode int32 = entity.DefaultSucessCode
	var statusMessage string = entity.DefaultSuccessMessage

	code := c.Param("product_code")
	if code == "" {
		statusCode = http.StatusBadRequest
		statusMessage = entity.ErrorSerialEmpty.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, statusCode, statusMessage, nil)
		return
	}

	tenantCode := c.Param("tenant_code")
	if tenantCode == "" {
		statusCode = http.StatusBadRequest
		statusMessage = entity.ErrorSerialEmpty.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, statusCode, statusMessage, nil)
		return
	}

	response, err := h.catalogUc.GetTenantProductByCode(c, code, tenantCode)
	if err != nil {
		statusCode = http.StatusInternalServerError
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, int32(statusCode), statusMessage, nil)
		return
	}

	helper.ResponseOutput(c, int32(statusCode), statusMessage, response)
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

func (h *httpHandler) UpdateObjectData(c *gin.Context) {
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

	if c.Param("serial") != "" {
		request.Serial = c.Param("serial")
	}

	request.UserSerial = defaultUserSerial

	response, err := h.catalogUc.UpdateObjectData(c, request)
	if err != nil {
		statusCode = http.StatusInternalServerError
		statusMessage = err.Error()

		if errors.Is(err, entity.ErrorNoUpdateDataFound) {
			statusCode = http.StatusNotFound
			statusMessage = entity.ErrorNoUpdateDataFound.Error()
		}

		log.Println(statusMessage)
		helper.ResponseOutput(c, int32(statusCode), statusMessage, nil)
		return
	}

	helper.ResponseOutput(c, int32(statusCode), statusMessage, response)
}

func (h *httpHandler) Login(c *gin.Context) {
	var statusCode int32 = entity.DefaultSucessCode
	var statusMessage string = entity.DefaultSuccessMessage

	request := entity.LoginRequest{}
	if err := c.ShouldBindJSON(&request); err != nil {
		statusCode = http.StatusBadRequest
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, statusCode, statusMessage, nil)
		return
	}

	if c.Param(entity.TENANT_CODE) != "" {
		request.TenantCode = c.Param(entity.TENANT_CODE)
	}

	if c.Param(entity.PRODUCT_CODE) != "" {
		request.ProductCode = c.Param(entity.PRODUCT_CODE)
	}

	response, err := h.authUc.Login(c, request)
	if err != nil {
		statusCode = http.StatusInternalServerError
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, int32(statusCode), statusMessage, nil)
		return
	}

	helper.ResponseOutput(c, int32(statusCode), statusMessage, response)
}

func (h *httpHandler) RefreshToken(c *gin.Context) {
	var statusCode int32 = entity.DefaultSucessCode
	var statusMessage string = entity.DefaultSuccessMessage

	request := entity.RefreshTokenRequest{}
	if err := c.ShouldBindJSON(&request); err != nil {
		statusCode = http.StatusBadRequest
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, statusCode, statusMessage, nil)
		return
	}

	response, err := h.authUc.RefreshToken(c, request.RefreshToken)
	if err != nil {
		statusCode = http.StatusInternalServerError
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, int32(statusCode), statusMessage, nil)
		return
	}

	helper.ResponseOutput(c, int32(statusCode), statusMessage, response)
}

func (h *httpHandler) EncryptPassword(c *gin.Context) {
	var statusCode int32 = entity.DefaultSucessCode
	var statusMessage string = entity.DefaultSuccessMessage

	request := entity.EncryptPasswordRequest{}

	if err := c.ShouldBindJSON(&request); err != nil {
		statusCode = http.StatusBadRequest
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, statusCode, statusMessage, nil)
		return
	}

	if c.Param(entity.TENANT_CODE) != "" {
		request.TenantCode = c.Param(entity.TENANT_CODE)
	}

	cipherTextB64, saltB64, ivB64, err := h.authUc.EncryptPassword(c, request.TenantCode, request.PlainPassword)
	if err != nil {
		statusCode = http.StatusInternalServerError
		statusMessage = err.Error()

		log.Println(statusMessage)
		helper.ResponseOutput(c, int32(statusCode), statusMessage, nil)
		return
	}

	response := entity.EncryptPasswordResponse{
		CipherText: cipherTextB64,
		Salt:       saltB64,
		Iv:         ivB64,
	}

	helper.ResponseOutput(c, int32(statusCode), statusMessage, response)
}
