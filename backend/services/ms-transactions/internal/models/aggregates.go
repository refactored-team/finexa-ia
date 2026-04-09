package models

import "encoding/json"

type TransactionAnalysis struct {
	AntExpenseTotal      *float64 `json:"ant_expense_total,omitempty"`
	AntExpensePercentage *float64 `json:"ant_expense_percentage,omitempty"`
	RiskLevel            *string  `json:"risk_level,omitempty"`
	Summary              *string  `json:"summary,omitempty"`
	UpdatedAt            string   `json:"updated_at"`
}

type Insight struct {
	ID                     int64    `json:"id"`
	Title                  *string  `json:"title,omitempty"`
	Description            *string  `json:"description,omitempty"`
	Priority               *string  `json:"priority,omitempty"`
	PotentialMonthlySaving *float64 `json:"potential_monthly_saving,omitempty"`
	AffectedCategory       *string  `json:"affected_category,omitempty"`
	UpdatedAt              string   `json:"updated_at"`
}

type ResilienceFactor struct {
	ID             int64    `json:"id"`
	Nombre         *string  `json:"nombre,omitempty"`
	Peso           *float64 `json:"peso,omitempty"`
	ScoreRaw       *float64 `json:"score_raw,omitempty"`
	ScorePonderado *float64 `json:"score_ponderado,omitempty"`
	Descripcion    *string  `json:"descripcion,omitempty"`
	UpdatedAt      string   `json:"updated_at"`
}

type CashFlow struct {
	RecurringExpenses   json.RawMessage `json:"recurring_expenses,omitempty"`
	ProjectedLiquidity  *float64        `json:"projected_liquidity,omitempty"`
	ImpulseAlerts       json.RawMessage `json:"impulse_alerts,omitempty"`
	ForecastHorizonDays *int            `json:"forecast_horizon_days,omitempty"`
	UpdatedAt           string          `json:"updated_at"`
}

type Pulse struct {
	ReferenceDate          *string  `json:"reference_date,omitempty"` // YYYY-MM-DD
	PresupuestoLibreDiario *float64 `json:"presupuesto_libre_diario,omitempty"`
	SaldoActual            *float64 `json:"saldo_actual,omitempty"`
	GastoFijoMensual       *float64 `json:"gasto_fijo_mensual,omitempty"`
	GastoVariableHoy       *float64 `json:"gasto_variable_hoy,omitempty"`
	GastoPromedioDiario    *float64 `json:"gasto_promedio_diario,omitempty"`
	DiasRestantesMes       *int     `json:"dias_restantes_mes,omitempty"`
	PorcentajeConsumidoMes *float64 `json:"porcentaje_consumido_mes,omitempty"`
	Alerta                 *string  `json:"alerta,omitempty"`
	UpdatedAt              string   `json:"updated_at"`
}
