package persistence

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"finexa-ia/ms-transactions/internal/models"
)

type Store struct {
	db *sql.DB
}

func New(db *sql.DB) *Store {
	return &Store{db: db}
}

func (s *Store) GetActivePlaidAccessToken(ctx context.Context, userID int64) (string, error) {
	const q = `SELECT access_token
FROM plaid_items
WHERE user_id = $1 AND deleted_at IS NULL
LIMIT 1`
	var tok string
	if err := s.db.QueryRowContext(ctx, q, userID).Scan(&tok); err != nil {
		return "", err
	}
	return tok, nil
}

func (s *Store) InsertFailedPipelineRun(ctx context.Context, userID int64, requestStats map[string]any, errDetail string) {
	reqJSON, _ := json.Marshal(requestStats)
	_, _ = s.db.ExecContext(ctx, `INSERT INTO finexa_tx.pipeline_runs (user_id, source, request_stats, status, error_detail)
VALUES ($1, 'plaid_sync_analyze', $2::jsonb, 'failed', $3)`, userID, reqJSON, errDetail)
}

func (s *Store) PersistAnalyze(ctx context.Context, userID int64, aiResp models.AIPipelineAnalyzeResponse, requestStats map[string]any) (int64, models.PersistCounts, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, models.PersistCounts{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	var counts models.PersistCounts
	var resilienceSnapshotID *int64
	if aiResp.Data.Resilience != nil {
		rawFeatures, _ := json.Marshal(aiResp.Data.Resilience.RawFeatures)
		exp, _ := json.Marshal(aiResp.Data.Resilience.ExplicacionLLM)
		var id int64
		err = tx.QueryRowContext(ctx, `INSERT INTO finexa_tx.resilience_snapshots
		(user_id, score_total, nivel, raw_features, explicacion_llm)
		VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
		RETURNING id`,
			userID, aiResp.Data.Resilience.ScoreTotal, aiResp.Data.Resilience.Nivel, rawFeatures, exp).Scan(&id)
		if err != nil {
			return 0, counts, fmt.Errorf("insert resilience snapshot: %w", err)
		}
		resilienceSnapshotID = &id
		counts.ResilienceSnapshot = 1
	}

	for _, t := range aiResp.Data.Classified {
		if t.TransactionID == nil || *t.TransactionID == "" {
			continue
		}
		_, err = tx.ExecContext(ctx, `INSERT INTO public.transactions
		(user_id, transaction_id, amount_cents, currency, description, posted_at, name, merchant_name, amount, date, datetime, category, confidence, is_ant_expense, reasoning, source)
		VALUES ($1,$2,$3,COALESCE($4,'USD'),$5,COALESCE($6::timestamptz, now()),$7,$8,$9,$10::date,$11::timestamptz,$12,$13,$14,$15,$16)
		ON CONFLICT (user_id, transaction_id) WHERE transaction_id IS NOT NULL
		DO UPDATE SET
		  amount_cents = EXCLUDED.amount_cents,
		  currency = EXCLUDED.currency,
		  description = EXCLUDED.description,
		  posted_at = EXCLUDED.posted_at,
		  name = EXCLUDED.name,
		  merchant_name = EXCLUDED.merchant_name,
		  amount = EXCLUDED.amount,
		  date = EXCLUDED.date,
		  datetime = EXCLUDED.datetime,
		  category = EXCLUDED.category,
		  confidence = EXCLUDED.confidence,
		  is_ant_expense = EXCLUDED.is_ant_expense,
		  reasoning = EXCLUDED.reasoning,
		  source = EXCLUDED.source,
		  deleted_at = NULL,
		  updated_at = now()`,
			userID,
			t.TransactionID,
			int64(t.Amount*100),
			"USD",
			t.Name,
			nullIfEmptyRFC3339Date(t.Date),
			t.Name,
			t.MerchantName,
			t.Amount,
			nullIfEmptyString(t.Date),
			nullIfEmpty(t.Datetime),
			t.Category,
			t.Confidence,
			t.IsAntExpense,
			t.Reasoning,
			t.Source,
		)
		if err != nil {
			return 0, counts, fmt.Errorf("upsert transaction: %w", err)
		}
		counts.Transactions++
	}

	if a := aiResp.Data.Analysis; a != nil {
		_, err = tx.ExecContext(ctx, `INSERT INTO finexa_tx.transaction_analysis
		(user_id, ant_expense_total, ant_expense_percentage, risk_level, summary)
		VALUES ($1,$2,$3,$4,$5)`,
			userID, a.AntExpenseTotal, a.AntExpensePercentage, a.RiskLevel, a.Summary)
		if err != nil {
			return 0, counts, fmt.Errorf("insert analysis: %w", err)
		}
		counts.AnalysisSnapshots = 1

		for _, i := range a.Insights {
			_, err = tx.ExecContext(ctx, `INSERT INTO finexa_tx.insights
			(user_id, title, description, priority, potential_monthly_saving, affected_category)
			VALUES ($1,$2,$3,$4,$5,$6)`,
				userID, i.Title, i.Description, i.Priority, i.PotentialMonthlySaving, i.AffectedCategory)
			if err != nil {
				return 0, counts, fmt.Errorf("insert insight: %w", err)
			}
			counts.Insights++
		}
	}

	if r := aiResp.Data.Resilience; r != nil {
		for _, f := range r.Factores {
			_, err = tx.ExecContext(ctx, `INSERT INTO finexa_tx.resilience_factors
			(user_id, resilience_snapshot_id, nombre, peso, score_raw, score_ponderado, descripcion)
			VALUES ($1,$2,$3,$4,$5,$6,$7)`,
				userID, resilienceSnapshotID, f.Nombre, f.Peso, f.ScoreRaw, f.ScorePonderado, f.Descripcion)
			if err != nil {
				return 0, counts, fmt.Errorf("insert resilience factor: %w", err)
			}
			counts.ResilienceFactors++
		}
	}

	if c := aiResp.Data.CashFlow; c != nil {
		_, err = tx.ExecContext(ctx, `INSERT INTO finexa_tx.cash_flow
		(user_id, recurring_expenses, projected_liquidity, impulse_alerts, forecast_horizon_days)
		VALUES ($1,$2::jsonb,$3,$4::jsonb,$5)`,
			userID, jsonOrEmptyArray(c.RecurringExpenses), c.ProjectedLiquidity, jsonOrEmptyArray(c.ImpulseAlerts), c.ForecastHorizonDays)
		if err != nil {
			return 0, counts, fmt.Errorf("insert cash flow: %w", err)
		}
		counts.CashFlowSnapshots = 1
	}

	if p := aiResp.Data.Pulse; p != nil {
		_, err = tx.ExecContext(ctx, `INSERT INTO finexa_tx.pulse
		(user_id, reference_date, presupuesto_libre_diario, saldo_actual, gasto_fijo_mensual, gasto_variable_hoy, gasto_promedio_diario, dias_restantes_mes, porcentaje_consumido_mes, alerta)
		VALUES ($1,$2::date,$3,$4,$5,$6,$7,$8,$9,$10)`,
			userID, p.ReferenceDate, p.PresupuestoLibreDiario, p.SaldoActual, p.GastoFijoMensual, p.GastoVariableHoy, p.GastoPromedioDiario, p.DiasRestantesMes, p.PorcentajeConsumidoMes, p.Alerta)
		if err != nil {
			return 0, counts, fmt.Errorf("insert pulse: %w", err)
		}
		counts.PulseSnapshots = 1
	}

	metaJSON, _ := json.Marshal(aiResp.Meta)
	reqStatsJSON, _ := json.Marshal(requestStats)
	var runID int64
	err = tx.QueryRowContext(ctx, `INSERT INTO finexa_tx.pipeline_runs
	(user_id, source, meta, request_stats, status, error_detail)
	VALUES ($1, 'plaid_sync_analyze', $2::jsonb, $3::jsonb, 'success', NULL)
	RETURNING id`, userID, metaJSON, reqStatsJSON).Scan(&runID)
	if err != nil {
		return 0, counts, fmt.Errorf("insert pipeline run: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return 0, counts, err
	}
	return runID, counts, nil
}

func jsonOrEmptyArray(raw json.RawMessage) []byte {
	if len(raw) == 0 {
		return []byte("[]")
	}
	return raw
}

func nullIfEmpty(v *string) any {
	if v == nil || *v == "" {
		return nil
	}
	return *v
}

func nullIfEmptyString(v string) any {
	if strings.TrimSpace(v) == "" {
		return nil
	}
	return v
}

func nullIfEmptyRFC3339Date(v string) any {
	if strings.TrimSpace(v) == "" {
		return nil
	}
	t, err := time.Parse("2006-01-02", v)
	if err != nil {
		return nil
	}
	return t.UTC().Format(time.RFC3339)
}
