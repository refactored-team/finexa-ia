-- Referencia de documentación (objetos finales). La fuente de verdad para aplicar cambios es migrations/*.sql en orden;
-- no reejecutar este archivo completo sobre una BD ya migrada (duplicaría tablas/índices).
--
-- Misma BD que ms-users / ms-plaid. Orden: ms-users → ms-transactions → ms-plaid.
-- public.transactions: migración 0001 + columnas extendidas en 0002_domain_tables_and_transactions_extend.sql
-- Tablas de dominio: schema finexa_tx (0002).

-- ── public.transactions (ledger + campos Plaid/IA) ───────────────────────────
CREATE TABLE transactions (
    id              bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id         bigint NOT NULL REFERENCES users (id),
    external_id     text,
    amount_cents    bigint NOT NULL,
    currency        text NOT NULL DEFAULT 'USD',
    description     text,
    posted_at       timestamptz NOT NULL DEFAULT now(),
    created_at      timestamptz NOT NULL DEFAULT now(),
    transaction_id  text,
    name            text,
    merchant_name   text,
    amount          numeric,
    date            date,
    datetime        timestamptz,
    category        text,
    confidence      numeric,
    is_ant_expense  boolean,
    reasoning       text,
    source          text,
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);

CREATE INDEX idx_transactions_user_id ON transactions USING btree (user_id);
CREATE UNIQUE INDEX idx_transactions_user_external ON transactions (user_id, external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX idx_transactions_user_transaction_id ON transactions (user_id, transaction_id) WHERE transaction_id IS NOT NULL;

-- ── finexa_tx.* (análisis agregados por usuario) ────────────────────────────
CREATE SCHEMA IF NOT EXISTS finexa_tx;

CREATE TABLE finexa_tx.transaction_analysis (
    id                         bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id                    bigint NOT NULL REFERENCES public.users (id),
    ant_expense_total          numeric,
    ant_expense_percentage     numeric,
    risk_level                 text,
    summary                    text,
    created_at                 timestamptz NOT NULL DEFAULT now(),
    updated_at                 timestamptz NOT NULL DEFAULT now(),
    deleted_at                 timestamptz
);

CREATE INDEX idx_transaction_analysis_user_id ON finexa_tx.transaction_analysis USING btree (user_id);

CREATE TABLE finexa_tx.insights (
    id                         bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id                    bigint NOT NULL REFERENCES public.users (id),
    title                      text,
    description                text,
    priority                   text,
    potential_monthly_saving   numeric,
    affected_category          text,
    created_at                 timestamptz NOT NULL DEFAULT now(),
    updated_at                 timestamptz NOT NULL DEFAULT now(),
    deleted_at                 timestamptz
);

CREATE INDEX idx_insights_user_id ON finexa_tx.insights USING btree (user_id);

CREATE TABLE finexa_tx.resilience_factors (
    id                         bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id                    bigint NOT NULL REFERENCES public.users (id),
    nombre                     text,
    peso                       numeric,
    score_raw                  numeric,
    score_ponderado            numeric,
    descripcion                text,
    created_at                 timestamptz NOT NULL DEFAULT now(),
    updated_at                 timestamptz NOT NULL DEFAULT now(),
    deleted_at                 timestamptz
);

CREATE INDEX idx_resilience_factors_user_id ON finexa_tx.resilience_factors USING btree (user_id);

CREATE TABLE finexa_tx.cash_flow (
    id                         bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id                    bigint NOT NULL REFERENCES public.users (id),
    recurring_expenses         jsonb,
    projected_liquidity        numeric,
    impulse_alerts             jsonb,
    forecast_horizon_days      int,
    created_at                 timestamptz NOT NULL DEFAULT now(),
    updated_at                 timestamptz NOT NULL DEFAULT now(),
    deleted_at                 timestamptz
);

CREATE INDEX idx_cash_flow_user_id ON finexa_tx.cash_flow USING btree (user_id);

CREATE TABLE finexa_tx.pulse (
    id                         bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id                    bigint NOT NULL REFERENCES public.users (id),
    reference_date             date,
    presupuesto_libre_diario   numeric,
    saldo_actual               numeric,
    gasto_fijo_mensual         numeric,
    gasto_variable_hoy         numeric,
    gasto_promedio_diario      numeric,
    dias_restantes_mes         int,
    porcentaje_consumido_mes   numeric,
    alerta                     text,
    created_at                 timestamptz NOT NULL DEFAULT now(),
    updated_at                 timestamptz NOT NULL DEFAULT now(),
    deleted_at                 timestamptz
);

CREATE INDEX idx_pulse_user_id ON finexa_tx.pulse USING btree (user_id);
