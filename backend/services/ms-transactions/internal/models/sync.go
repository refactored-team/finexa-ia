package models

import "encoding/json"

type SyncAnalyzeRequest struct {
	UserProfile       map[string]any `json:"user_profile,omitempty"`
	SaldoActual       *float64       `json:"saldo_actual,omitempty"`
	LiquidezThreshold *float64       `json:"liquidez_threshold,omitempty"`
}

type SyncAnalyzeResponse struct {
	RunID             int64         `json:"run_id"`
	SyncedCount       int           `json:"synced_count"`
	ClassifiedCount   int           `json:"classified_count"`
	ParseErrors       int           `json:"parse_errors"`
	PersistedEntities PersistCounts `json:"persisted_entities"`
}

type PersistCounts struct {
	Transactions       int `json:"transactions"`
	AnalysisSnapshots  int `json:"analysis_snapshots"`
	Insights           int `json:"insights"`
	ResilienceFactors  int `json:"resilience_factors"`
	ResilienceSnapshot int `json:"resilience_snapshot"`
	CashFlowSnapshots  int `json:"cash_flow_snapshots"`
	PulseSnapshots     int `json:"pulse_snapshots"`
}

type AIPipelineAnalyzeRequest struct {
	Transactions      []map[string]any `json:"transactions"`
	UserProfile       map[string]any   `json:"user_profile,omitempty"`
	SaldoActual       *float64         `json:"saldo_actual,omitempty"`
	LiquidezThreshold *float64         `json:"liquidez_threshold,omitempty"`
}

type AIPipelineAnalyzeResponse struct {
	OK   bool            `json:"ok"`
	Data AIAnalyzeData   `json:"data"`
	Meta AIAnalyzeMeta   `json:"meta"`
	Raw  json.RawMessage `json:"-"`
}

type AIAnalyzeMeta struct {
	ElapsedMS           int `json:"elapsed_ms"`
	TotalTransactions   int `json:"total_transactions"`
	Parsed              int `json:"parsed"`
	Classified          int `json:"classified"`
	ParseErrors         int `json:"parse_errors"`
	FromCache           int `json:"from_cache"`
	FromHeuristic       int `json:"from_heuristic"`
	FromBedrock         int `json:"from_bedrock"`
	FromFallback        int `json:"from_fallback"`
	AntExpensesDetected int `json:"ant_expenses_detected"`
}

type AIAnalyzeData struct {
	Classified []AIEnrichedTransaction `json:"classified"`
	Analysis   *AIBehavioralAnalysis   `json:"analysis"`
	Resilience *AIResilienceScore      `json:"resilience"`
	CashFlow   *AICashFlow             `json:"cash_flow"`
	Pulse      *AIPulse                `json:"pulse"`
}

type AIEnrichedTransaction struct {
	TransactionID *string  `json:"transaction_id"`
	Name          string   `json:"name"`
	MerchantName  *string  `json:"merchant_name"`
	Amount        float64  `json:"amount"`
	Date          string   `json:"date"`
	Datetime      *string  `json:"datetime"`
	Category      *string  `json:"category"`
	Confidence    *float64 `json:"confidence"`
	IsAntExpense  *bool    `json:"is_ant_expense"`
	Reasoning     *string  `json:"reasoning"`
	Source        *string  `json:"source"`
}

type AIBehavioralAnalysis struct {
	AntExpenseTotal      *float64    `json:"ant_expense_total"`
	AntExpensePercentage *float64    `json:"ant_expense_percentage"`
	RiskLevel            *string     `json:"risk_level"`
	Summary              *string     `json:"summary"`
	Insights             []AIInsight `json:"insights"`
}

type AIInsight struct {
	Title                  *string  `json:"title"`
	Description            *string  `json:"description"`
	Priority               *string  `json:"priority"`
	PotentialMonthlySaving *float64 `json:"potential_monthly_saving"`
	AffectedCategory       *string  `json:"affected_category"`
}

type AIResilienceScore struct {
	ScoreTotal     *float64             `json:"score_total"`
	Nivel          *string              `json:"nivel"`
	RawFeatures    map[string]float64   `json:"raw_features"`
	ExplicacionLLM map[string]any       `json:"explicacion_llm"`
	Factores       []AIResilienceFactor `json:"factores"`
}

type AIResilienceFactor struct {
	Nombre         *string  `json:"nombre"`
	Peso           *float64 `json:"peso"`
	ScoreRaw       *float64 `json:"score_raw"`
	ScorePonderado *float64 `json:"score_ponderado"`
	Descripcion    *string  `json:"descripcion"`
}

type AICashFlow struct {
	RecurringExpenses   json.RawMessage `json:"recurring_expenses"`
	ProjectedLiquidity  *float64        `json:"projected_liquidity"`
	ImpulseAlerts       json.RawMessage `json:"impulse_alerts"`
	ForecastHorizonDays *int            `json:"forecast_horizon_days"`
}

type AIPulse struct {
	ReferenceDate          *string  `json:"reference_date"`
	PresupuestoLibreDiario *float64 `json:"presupuesto_libre_diario"`
	SaldoActual            *float64 `json:"saldo_actual"`
	GastoFijoMensual       *float64 `json:"gasto_fijo_mensual"`
	GastoVariableHoy       *float64 `json:"gasto_variable_hoy"`
	GastoPromedioDiario    *float64 `json:"gasto_promedio_diario"`
	DiasRestantesMes       *int     `json:"dias_restantes_mes"`
	PorcentajeConsumidoMes *float64 `json:"porcentaje_consumido_mes"`
	Alerta                 *string  `json:"alerta"`
}
