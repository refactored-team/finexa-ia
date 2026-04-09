package handlers

import (
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/require"

	"finexa-ia/ms-transactions/internal/config"
)

func TestListTransactions_UsesPathUserID(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	t.Cleanup(func() { _ = db.Close() })

	h := NewTransactionsHandler(db, &config.App{})

	uid := int64(123)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT id, transaction_id, amount_cents, currency, COALESCE(description, ''), posted_at, category, deleted_at
FROM transactions
WHERE user_id = $1
  AND deleted_at IS NULL
  AND ($2::timestamptz IS NULL OR posted_at >= $2::timestamptz)
  AND ($3::timestamptz IS NULL OR posted_at <= $3::timestamptz)
  AND ($4::text IS NULL OR $4::text = '' OR category = $4::text)
ORDER BY posted_at DESC, id DESC
LIMIT $5 OFFSET $6`)).
		WithArgs(uid, nil, nil, "", 50, 0).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "transaction_id", "amount_cents", "currency", "description", "posted_at", "category", "deleted_at",
		}))

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/v1/users/123/transactions", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/v1/users/:userId/transactions")
	c.SetPathValues(echo.PathValues{{Name: "userId", Value: "123"}})

	err = h.list(c)
	require.NoError(t, err)
	require.NoError(t, mock.ExpectationsWereMet())
	require.Equal(t, http.StatusOK, rec.Code)
	require.True(t, strings.Contains(rec.Body.String(), `"ok":true`))
}

func TestGetByID_UsesPathUserID(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	t.Cleanup(func() { _ = db.Close() })

	h := NewTransactionsHandler(db, &config.App{})

	uid := int64(555)
	txID := int64(999)
	mock.ExpectQuery(`SELECT id, transaction_id, amount_cents, currency, COALESCE\(description, ''\), posted_at, category, deleted_at\s+FROM transactions\s+WHERE user_id = \$1\s+AND\s+id\s*=\s*\$2\s+AND deleted_at IS NULL\s+LIMIT 1`).
		WithArgs(uid, txID).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "transaction_id", "amount_cents", "currency", "description", "posted_at", "category", "deleted_at",
		}).AddRow(txID, nil, int64(1000), "MXN", "test", time.Date(2026, 4, 9, 0, 0, 0, 0, time.UTC), nil, nil))

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/v1/users/555/transactions/999", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/v1/users/:userId/transactions/:id")
	c.SetPathValues(echo.PathValues{
		{Name: "userId", Value: "555"},
		{Name: "id", Value: "999"},
	})

	err = h.getByID(c)
	require.NoError(t, err)
	require.NoError(t, mock.ExpectationsWereMet())
	require.Equal(t, http.StatusOK, rec.Code)
	require.True(t, strings.Contains(rec.Body.String(), `"ok":true`))
}
