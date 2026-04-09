-- migrate:up
CREATE TABLE finexa_tx.pipeline_runs (
    id             bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id        bigint NOT NULL REFERENCES public.users (id),
    source         text NOT NULL,
    meta           jsonb,
    request_stats  jsonb,
    status         text NOT NULL,
    error_detail   text,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pipeline_runs_user_id ON finexa_tx.pipeline_runs USING btree (user_id);
CREATE INDEX idx_pipeline_runs_status ON finexa_tx.pipeline_runs USING btree (status);

CREATE TABLE finexa_tx.resilience_snapshots (
    id              bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id         bigint NOT NULL REFERENCES public.users (id),
    score_total     numeric,
    nivel           text,
    raw_features    jsonb,
    explicacion_llm jsonb,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);

CREATE INDEX idx_resilience_snapshots_user_id ON finexa_tx.resilience_snapshots USING btree (user_id);

ALTER TABLE finexa_tx.resilience_factors
    ADD COLUMN IF NOT EXISTS resilience_snapshot_id bigint REFERENCES finexa_tx.resilience_snapshots (id);

CREATE INDEX idx_resilience_factors_snapshot_id
    ON finexa_tx.resilience_factors USING btree (resilience_snapshot_id);

CREATE TRIGGER tr_pipeline_runs_updated_at
    BEFORE UPDATE ON finexa_tx.pipeline_runs
    FOR EACH ROW
    EXECUTE FUNCTION finexa_tx.touch_updated_at();

CREATE TRIGGER tr_resilience_snapshots_updated_at
    BEFORE UPDATE ON finexa_tx.resilience_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION finexa_tx.touch_updated_at();

-- migrate:down
DROP TRIGGER IF EXISTS tr_resilience_snapshots_updated_at ON finexa_tx.resilience_snapshots;
DROP TRIGGER IF EXISTS tr_pipeline_runs_updated_at ON finexa_tx.pipeline_runs;

DROP INDEX IF EXISTS idx_resilience_factors_snapshot_id;
ALTER TABLE finexa_tx.resilience_factors
    DROP COLUMN IF EXISTS resilience_snapshot_id;

DROP INDEX IF EXISTS idx_resilience_snapshots_user_id;
DROP TABLE IF EXISTS finexa_tx.resilience_snapshots;

DROP INDEX IF EXISTS idx_pipeline_runs_status;
DROP INDEX IF EXISTS idx_pipeline_runs_user_id;
DROP TABLE IF EXISTS finexa_tx.pipeline_runs;
