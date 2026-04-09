-- Domain tables live in schema finexa_tx (avoids name clash with public.transactions).
-- Uniqueness: Plaid transaction_id is enforced per user via (user_id, transaction_id) WHERE transaction_id IS NOT NULL.
--
-- migrate:up
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

CREATE OR REPLACE FUNCTION finexa_tx.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_transaction_analysis_updated_at
    BEFORE UPDATE ON finexa_tx.transaction_analysis
    FOR EACH ROW
    EXECUTE FUNCTION finexa_tx.touch_updated_at();

CREATE TRIGGER tr_insights_updated_at
    BEFORE UPDATE ON finexa_tx.insights
    FOR EACH ROW
    EXECUTE FUNCTION finexa_tx.touch_updated_at();

CREATE TRIGGER tr_resilience_factors_updated_at
    BEFORE UPDATE ON finexa_tx.resilience_factors
    FOR EACH ROW
    EXECUTE FUNCTION finexa_tx.touch_updated_at();

CREATE TRIGGER tr_cash_flow_updated_at
    BEFORE UPDATE ON finexa_tx.cash_flow
    FOR EACH ROW
    EXECUTE FUNCTION finexa_tx.touch_updated_at();

CREATE TRIGGER tr_pulse_updated_at
    BEFORE UPDATE ON finexa_tx.pulse
    FOR EACH ROW
    EXECUTE FUNCTION finexa_tx.touch_updated_at();

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS transaction_id text,
    ADD COLUMN IF NOT EXISTS name text,
    ADD COLUMN IF NOT EXISTS merchant_name text,
    ADD COLUMN IF NOT EXISTS amount numeric,
    ADD COLUMN IF NOT EXISTS date date,
    ADD COLUMN IF NOT EXISTS datetime timestamptz,
    ADD COLUMN IF NOT EXISTS category text,
    ADD COLUMN IF NOT EXISTS confidence numeric,
    ADD COLUMN IF NOT EXISTS is_ant_expense boolean,
    ADD COLUMN IF NOT EXISTS reasoning text,
    ADD COLUMN IF NOT EXISTS source text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE OR REPLACE FUNCTION public.touch_transactions_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_transactions_updated_at ON public.transactions;
CREATE TRIGGER tr_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_transactions_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_transaction_id
    ON public.transactions (user_id, transaction_id)
    WHERE transaction_id IS NOT NULL;

-- migrate:down
DROP TRIGGER IF EXISTS tr_transactions_updated_at ON public.transactions;
DROP FUNCTION IF EXISTS public.touch_transactions_updated_at();

DROP INDEX IF EXISTS idx_transactions_user_transaction_id;

ALTER TABLE public.transactions
    DROP COLUMN IF EXISTS transaction_id,
    DROP COLUMN IF EXISTS name,
    DROP COLUMN IF EXISTS merchant_name,
    DROP COLUMN IF EXISTS amount,
    DROP COLUMN IF EXISTS date,
    DROP COLUMN IF EXISTS datetime,
    DROP COLUMN IF EXISTS category,
    DROP COLUMN IF EXISTS confidence,
    DROP COLUMN IF EXISTS is_ant_expense,
    DROP COLUMN IF EXISTS reasoning,
    DROP COLUMN IF EXISTS source,
    DROP COLUMN IF EXISTS updated_at,
    DROP COLUMN IF EXISTS deleted_at;

DROP TRIGGER IF EXISTS tr_pulse_updated_at ON finexa_tx.pulse;
DROP TRIGGER IF EXISTS tr_cash_flow_updated_at ON finexa_tx.cash_flow;
DROP TRIGGER IF EXISTS tr_resilience_factors_updated_at ON finexa_tx.resilience_factors;
DROP TRIGGER IF EXISTS tr_insights_updated_at ON finexa_tx.insights;
DROP TRIGGER IF EXISTS tr_transaction_analysis_updated_at ON finexa_tx.transaction_analysis;

DROP FUNCTION IF EXISTS finexa_tx.touch_updated_at();

DROP TABLE IF EXISTS finexa_tx.pulse;
DROP TABLE IF EXISTS finexa_tx.cash_flow;
DROP TABLE IF EXISTS finexa_tx.resilience_factors;
DROP TABLE IF EXISTS finexa_tx.insights;
DROP TABLE IF EXISTS finexa_tx.transaction_analysis;

DROP SCHEMA IF EXISTS finexa_tx;
