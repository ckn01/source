package config

import (
	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	DBType string `envconfig:"DB_TYPE" default:"postgres"`

	HTTPPort    string `envconfig:"HTTP_PORT" default:"8080"`
	Environment string `envconfig:"ENVIRONMENT" default:"staging"`

	Host            string `envconfig:"FETCHLY_PGSQL_HOST" default:""`
	Port            string `envconfig:"FETCHLY_PGSQL_PORT" default:""`
	Username        string `envconfig:"FETCHLY_PGSQL_USERNAME" default:""`
	Password        string `envconfig:"FETCHLY_PGSQL_PASSWORD" default:""`
	DBName          string `envconfig:"FETCHLY_PGSQL_DBNAME" default:""`
	LogMode         bool   `envconfig:"DB_LOG_MODE" default:"true"`
	MaxIdleConns    int    `envconfig:"DB_MAX_IDLE_CONNS" default:"5"`
	MaxOpenConns    int    `envconfig:"DB_MAX_OPEN_CONNS" default:"10"`
	ConnMaxLifetime int    `envconfig:"DB_CONN_MAX_LIFETIME" default:"10"`
	IsDebugMode     bool   `envconfig:"DEBUG_MODE" default:"true"`

	RedisHost          string `envconfig:"REDIS_HOST" default:"127.0.0.1"`
	RedisPort          string `envconfig:"REDIS_PORT" default:"6379"`
	RedisPassword      string `envconfig:"REDIS_PASSWORD" default:""`
	RedisMaxIdle       int    `envconfig:"REDIS_MAX_IDLE" default:"10"`
	DefaultTTL         int64  `envconfig:"DEFAULT_TTL" default:"3600"`
	PDFPath            string `envconfig:"PDF_PATH" default:""`
	PDFChunkingKeyword string `envconfig:"PDF_CHUNKING_KEYWORD" default:""`

	InternalSecretKey string `envconfig:"INTERNAL_SECRET_KEY" default:"INTERNAL_SECRET_KEY"`

	GeminiAPIKey          string  `envconfig:"GEMINI_API_KEY" default:"AIzaSyAReXf40rwS8WUSSdG2Uh0mgYrib7ByNjI"`
	EnableAIChatbot       bool    `envconfig:"ENABLE_AI_CHATBOT" default:"true"`
	AIChatbotProduct      string  `envconfig:"AI_CHATBOT_PRODUCT" default:"gemini"`
	AIChatbotModel        string  `envconfig:"AI_CHATBOT_MODEL" default:"gemini-2.0-flash"`
	AIEmbeddingModel      string  `envconfig:"AI_EMBEDDING_MODEL" default:"text-embedding-004"`
	AIChatbotKeywordStart string  `envconfig:"AI_CHATBOT_KEYWORD_START" default:"tanya ai"`
	AIChatbotKeywordStop  string  `envconfig:"AI_CHATBOT_KEYWORD_STOP" default:"stop tanya ai"`
	AIMaxOutputTokens     int32   `envconfig:"AI_MAX_OUTPUT_TOKENS" default:"2000"`
	AITemperature         float32 `envconfig:"AI_TEMPERATURE" default:"1"`
	AITopK                int32   `envconfig:"AI_TOP_K" default:"10"`
	AITopP                float32 `envconfig:"AI_TOP_P" default:"0.95"`
	AIDebugMode           bool    `envconfig:"AI_DEBUG_MODE" default:"true"`
}

func Get() Config {
	cfg := Config{}
	envconfig.MustProcess("", &cfg)
	return cfg
}
