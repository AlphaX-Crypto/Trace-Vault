-- 012_create_risk_signals.sql
CREATE TABLE IF NOT EXISTS risk_signals (
    id SERIAL PRIMARY KEY,
    risk_result_id INTEGER NOT NULL REFERENCES risk_results(id) ON DELETE CASCADE,
    signal_id VARCHAR(64),
    signal_type VARCHAR(50) NOT NULL,
    score NUMERIC(5,2) DEFAULT 0.0,
    severity VARCHAR(20) DEFAULT 'MEDIUM',
    description TEXT NOT NULL,
    reason TEXT,
    entity VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_signals_result_id ON risk_signals(risk_result_id);
CREATE INDEX IF NOT EXISTS idx_risk_signals_type ON risk_signals(signal_type);
