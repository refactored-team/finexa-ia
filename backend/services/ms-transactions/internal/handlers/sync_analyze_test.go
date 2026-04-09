package handlers

import (
	"encoding/json"
	"testing"

	"github.com/plaid/plaid-go/v41/plaid"
	"github.com/stretchr/testify/require"
)

func TestPlaidToAnalyzeTransactions_MapsRequiredAndOptionalFields(t *testing.T) {
	var tx plaid.Transaction
	err := json.Unmarshal([]byte(`{
		"transaction_id": "tx_123",
		"name": "Coffee Shop",
		"merchant_name": "Coffee Shop MX",
		"amount": 123.45,
		"date": "2026-04-09",
		"iso_currency_code": "MXN",
		"pending": false
	}`), &tx)
	require.NoError(t, err)

	out := plaidToAnalyzeTransactions([]plaid.Transaction{tx})
	require.Len(t, out, 1)
	require.Equal(t, "tx_123", out[0]["transaction_id"])
	require.Equal(t, "Coffee Shop", out[0]["name"])
	require.Equal(t, "Coffee Shop MX", out[0]["merchant_name"])
	require.Equal(t, "2026-04-09", out[0]["date"])
	require.Equal(t, "MXN", out[0]["iso_currency_code"])
}

func TestPlaidToAnalyzeTransactions_SkipsInvalidRows(t *testing.T) {
	var tx plaid.Transaction
	err := json.Unmarshal([]byte(`{
		"transaction_id": "tx_invalid",
		"name": "",
		"amount": 10.5,
		"date": ""
	}`), &tx)
	require.NoError(t, err)

	out := plaidToAnalyzeTransactions([]plaid.Transaction{tx})
	require.Len(t, out, 0)
}
