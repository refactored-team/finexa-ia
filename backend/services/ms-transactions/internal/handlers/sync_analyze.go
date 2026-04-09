package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/plaid/plaid-go/v41/plaid"

	"finexa-ia/apiresult"
	"finexa-ia/ms-transactions/internal/models"
)

// syncAndAnalyze runs Plaid sync -> ai-pipeline analyze -> persistence in one synchronous request.
//
//	@Summary		Sincronizar Plaid + analizar + persistir
//	@Description	Obtiene transacciones del usuario desde Plaid, llama ai-pipeline /analyze y persiste resultados core + meta.
//	@Tags			transactions
//	@Accept			json
//	@Produce		json
//	@Param			body	body		models.SyncAnalyzeRequest	false	"Opcionales para /analyze (user_profile, saldo_actual, liquidez_threshold)"
//	@Success		200		{object}	apiresult.okEnvelope[models.SyncAnalyzeResponse]
//	@Failure		400		{object}	apiresult.ErrResult
//	@Failure		401		{object}	apiresult.ErrResult
//	@Failure		502		{object}	apiresult.ErrResult
//	@Failure		503		{object}	apiresult.ErrResult
//	@Failure		500		{object}	apiresult.ErrResult
//	@Router			/v1/transactions/sync-and-analyze [post]
func (h *TransactionsHandler) syncAndAnalyze(c *echo.Context) error {
	uid, ok := authUserID(c)
	if !ok {
		return apiresult.RespondError(c, http.StatusUnauthorized, apiresult.CodeUnauthorized, "missing authenticated user", nil)
	}
	if h.store == nil {
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, "store not initialized", nil)
	}
	if h.plaid == nil || !h.plaid.Configured() {
		return apiresult.RespondError(c, http.StatusServiceUnavailable, apiresult.CodePlaidNotConfigured, "plaid client not configured", nil)
	}

	var req models.SyncAnalyzeRequest
	if err := c.Bind(&req); err != nil && !strings.Contains(strings.ToLower(err.Error()), "eof") {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid request body", nil)
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 90*time.Second)
	defer cancel()

	accessToken, err := h.store.GetActivePlaidAccessToken(ctx, uid)
	if err != nil {
		return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, "plaid access token not found for user", nil)
	}

	syncRes, err := h.plaid.SyncAll(ctx, accessToken)
	if err != nil {
		h.store.InsertFailedPipelineRun(ctx, uid, map[string]any{"stage": "plaid_sync"}, err.Error())
		return apiresult.RespondError(c, http.StatusBadGateway, apiresult.CodePlaidUpstreamError, "failed to sync transactions from plaid", map[string]any{"cause": err.Error()})
	}

	aiReq := models.AIPipelineAnalyzeRequest{
		Transactions:      plaidToAnalyzeTransactions(syncRes.Transactions),
		UserProfile:       req.UserProfile,
		SaldoActual:       req.SaldoActual,
		LiquidezThreshold: req.LiquidezThreshold,
	}
	if len(aiReq.Transactions) == 0 {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "no valid transactions to analyze", nil)
	}

	aiResp, err := h.ai.Analyze(ctx, aiReq)
	if err != nil {
		h.store.InsertFailedPipelineRun(ctx, uid, map[string]any{
			"stage":        "ai_analyze",
			"synced_count": len(syncRes.Transactions),
			"pages":        syncRes.Pages,
		}, err.Error())
		return apiresult.RespondError(c, http.StatusBadGateway, apiresult.CodeBadGateway, "failed to analyze transactions with ai-pipeline", map[string]any{"cause": err.Error()})
	}

	runID, persisted, err := h.store.PersistAnalyze(ctx, uid, aiResp, map[string]any{
		"synced_count": len(syncRes.Transactions),
		"pages":        syncRes.Pages,
	})
	if err != nil {
		h.store.InsertFailedPipelineRun(ctx, uid, map[string]any{
			"stage":        "persist",
			"synced_count": len(syncRes.Transactions),
			"pages":        syncRes.Pages,
		}, err.Error())
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, "failed to persist analysis results", map[string]any{"cause": err.Error()})
	}

	return apiresult.RespondOK(c, http.StatusOK, models.SyncAnalyzeResponse{
		RunID:             runID,
		SyncedCount:       len(syncRes.Transactions),
		ClassifiedCount:   aiResp.Meta.Classified,
		ParseErrors:       aiResp.Meta.ParseErrors,
		PersistedEntities: persisted,
	})
}

func plaidToAnalyzeTransactions(items []plaid.Transaction) []map[string]any {
	out := make([]map[string]any, 0, len(items))
	for _, tx := range items {
		raw, err := json.Marshal(tx)
		if err != nil {
			continue
		}
		var m map[string]any
		if err := json.Unmarshal(raw, &m); err != nil {
			continue
		}

		name := toString(m["name"])
		date := toString(m["date"])
		amount, ok := toFloat(m["amount"])
		if name == "" || date == "" || !ok {
			continue
		}

		outItem := map[string]any{
			"name":   name,
			"date":   date,
			"amount": amount,
		}
		if v := toString(m["transaction_id"]); v != "" {
			outItem["transaction_id"] = v
		}
		if v := toString(m["merchant_name"]); v != "" {
			outItem["merchant_name"] = v
		}
		if v := toString(m["iso_currency_code"]); v != "" {
			outItem["iso_currency_code"] = v
		}
		if v, exists := m["pending"]; exists {
			outItem["pending"] = v
		}
		if v, exists := m["personal_finance_category"]; exists {
			outItem["personal_finance_category"] = v
		}
		if v, exists := m["counterparties"]; exists {
			outItem["counterparties"] = v
		}
		out = append(out, outItem)
	}
	return out
}

func toString(v any) string {
	switch t := v.(type) {
	case string:
		return strings.TrimSpace(t)
	default:
		return strings.TrimSpace(fmt.Sprint(v))
	}
}

func toFloat(v any) (float64, bool) {
	switch t := v.(type) {
	case float64:
		return t, true
	case float32:
		return float64(t), true
	case int:
		return float64(t), true
	case int64:
		return float64(t), true
	case json.Number:
		f, err := t.Float64()
		return f, err == nil
	default:
		return 0, false
	}
}
