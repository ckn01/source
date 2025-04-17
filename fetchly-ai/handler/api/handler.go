package api

import (
	"net/http"

	"github.com/fetchlydev/source/fetchly-ai/config"
	"github.com/fetchlydev/source/fetchly-ai/core/entity"
	"github.com/fetchlydev/source/fetchly-ai/core/module"
	"github.com/fetchlydev/source/fetchly-ai/pkg/helper"

	"github.com/gin-gonic/gin"
)

type HTTPHandler interface {
	GenerateRAGTextAnswer(c *gin.Context)
}

type httpHandler struct {
	cfg   config.Config
	ragUc module.RAGUsecase
}

func NewHTTPHandler(cfg config.Config, ragUc module.RAGUsecase) HTTPHandler {
	return &httpHandler{
		cfg:   cfg,
		ragUc: ragUc,
	}
}

func (h *httpHandler) GenerateRAGTextAnswer(c *gin.Context) {
	var statusCode int = 200
	var statusMessage string = "success"

	req := entity.GenerateRAGTextAnswerRequest{}
	if err := c.ShouldBindJSON(&req); err != nil {
		statusCode = http.StatusBadRequest
		statusMessage = err.Error()
		helper.ResponseOutput(c, int32(statusCode), statusMessage, nil)

		return
	}

	response, err := h.ragUc.GenerateRAGTextAnswer(c, req.Question)
	if err != nil {
		statusCode = http.StatusInternalServerError
		statusMessage = err.Error()
		helper.ResponseOutput(c, int32(statusCode), statusMessage, nil)

		return
	}

	helper.ResponseOutput(c, int32(statusCode), statusMessage, response)
}
