-- 011_create_risk_results.sql
CREATE TABLE IF NOT EXISTS risk_results (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(64) NOT NULL REFERENCES analysis_results(analysis_id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    explanation TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_results_analysis_id ON risk_results(analysis_id);
CREATE INDEX IF NOT EXISTS idx_risk_results_level ON risk_results(level);
