package entity

var (
	DefaultOpeningPrompt  string = "Halo, saya %s"
	DefaultStoppingPrompt string = "Baiklah, Sampai jumpa!"

	HistoryRoleUSER  string = "user"
	HistoryRoleMODEL string = "model"
)

type ParentTopic struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type DataSetTopic struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	ParentTopic ParentTopic `json:"parent_topic"`
}

type DataSet struct {
	ID                     string
	Question               string
	Answer                 string
	DataSetTopic           DataSetTopic
	IsDatasetSearchStarter bool
	IsDatasetSearchStopper bool
	IsAssignToAgentKeyword bool
}

type RankedDataSet struct {
	DataSet
	Similarity float64
}

type GetDataSetByChannelIDRequest struct {
	IsDatasetSearchStarter *bool
	IsDatasetSearchStopper *bool
	IsAssignToAgentKeyword *bool
}

type Documents struct {
	ID        int64  `json:"id"`
	Serial    string `json:"serial"`
	Section   string `json:"section"`
	Content   string `json:"content"`
	Embedding string `json:"embedding"`
}

type GenerateRAGTextAnswerRequest struct {
	Question string `json:"question"`
}
