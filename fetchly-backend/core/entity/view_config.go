package entity

// ViewComponent represents a generic view component
type ViewComponent struct {
	Type      string          `json:"type"`
	SubType   string          `json:"subType,omitempty"`
	Props     map[string]any  `json:"props"`
	ClassName string          `json:"className,omitempty"`
	Children  []ViewComponent `json:"children,omitempty"`
}

// ViewDataSource represents an API data source configuration
type ViewDataSource struct {
	Type            string         `json:"type"`
	Method          string         `json:"method"`
	Endpoint        string         `json:"endpoint"`
	Params          map[string]any `json:"params,omitempty"`
	Body            map[string]any `json:"body,omitempty"`
	Headers         map[string]any `json:"headers,omitempty"`
	RefreshInterval int            `json:"refreshInterval,omitempty"`
	Transform       string         `json:"transform,omitempty"`
}

// ChartConfig represents chart-specific configuration
type ChartConfig struct {
	Type    string   `json:"type"`
	XAxis   string   `json:"xAxis"`
	YAxis   string   `json:"yAxis"`
	Series  []string `json:"series"`
	Options struct {
		Legend    bool `json:"legend"`
		Tooltip   bool `json:"tooltip"`
		Animation bool `json:"animation"`
	} `json:"options"`
}

// GridProps represents grid-specific properties
type GridProps struct {
	Spacing   int            `json:"spacing"`
	Container bool           `json:"container"`
	XS        int            `json:"xs,omitempty"` // 1-12 for extra small screens
	SM        int            `json:"sm,omitempty"` // 1-12 for small screens
	MD        int            `json:"md,omitempty"` // 1-12 for medium screens
	LG        int            `json:"lg,omitempty"` // 1-12 for large screens
	XL        int            `json:"xl,omitempty"` // 1-12 for extra large screens
	Style     map[string]any `json:"style,omitempty"`
}

// ScoreCardConfig represents score card configuration
type ScoreCardConfig struct {
	Layout  string         `json:"layout"`  // horizontal or vertical
	Spacing int            `json:"spacing"` // spacing between cards
	Cards   []ScoreCard    `json:"cards"`   // list of score cards
	Style   map[string]any `json:"style"`   // custom styling
}

// ScoreCard represents individual score card configuration
type ScoreCard struct {
	Title      string          `json:"title"`
	Subtitle   string          `json:"subtitle,omitempty"`
	Value      string          `json:"value"`
	Unit       string          `json:"unit,omitempty"`
	Icon       string          `json:"icon,omitempty"`
	Color      string          `json:"color,omitempty"`
	Trend      *ScoreCardTrend `json:"trend,omitempty"`
	DataSource *ViewDataSource `json:"dataSource,omitempty"`
	Style      map[string]any  `json:"style,omitempty"`
}

// ScoreCardTrend represents trend information for a score card
type ScoreCardTrend struct {
	Value    float64 `json:"value"`
	Type     string  `json:"type"`      // increase, decrease, neutral
	IsGood   bool    `json:"is_good"`   // whether the trend is positive or negative
	TimeSpan string  `json:"time_span"` // e.g., "vs last month", "vs last year"
}

// Constants for component types
const (
	// Container types
	TypeWebView    = "webView"
	TypeMobileView = "mobileView"
	TypeGrid       = "grid"
	TypeGridItem   = "gridItem"
	TypeContainer  = "container"
	TypeSection    = "section"
	TypeRow        = "row"
	TypeColumn     = "column"

	// Component types
	TypeTable      = "table"
	TypeForm       = "form"
	TypeNavigation = "navigation"
	TypeDetail     = "detail"
	TypeChart      = "chart"
	TypeScoreCard  = "scoreCard"

	// Chart subtypes
	ChartTypeLine    = "line"
	ChartTypeBar     = "bar"
	ChartTypePie     = "pie"
	ChartTypeArea    = "area"
	ChartTypeScatter = "scatter"
	ChartTypeRadar   = "radar"

	// Score card layouts
	ScoreCardLayoutHorizontal = "horizontal"
	ScoreCardLayoutVertical   = "vertical"

	// Score card trend types
	ScoreCardTrendIncrease = "increase"
	ScoreCardTrendDecrease = "decrease"
	ScoreCardTrendNeutral  = "neutral"

	// Data source types
	DataSourceTypeAPI    = "api"
	DataSourceTypeStatic = "static"
	DataSourceTypeQuery  = "query"
)
