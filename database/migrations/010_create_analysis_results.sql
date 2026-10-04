-- 010_create_analysis_results.sql
CREATE TABLE IF NOT EXISTS analysis_results (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(64) UNIQUE NOT NULL,
    case_id VARCHAR(64) NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    subject VARCHAR(128) NOT NULL,
    wallet VARCHAR(128) NOT NULL,
    blockchain VARCHAR(50) DEFAULT 'ethereum',
    status VARCHAR(50) DEFAULT 'Analysis complete',
    nearest_vasp VARCHAR(255),
    confidence NUMERIC(5,2),
    confidence_label VARCHAR(30),
    analysis_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analysis_results_analysis_id ON analysis_results(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_case_id ON analysis_results(case_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_wallet ON analysis_results(wallet);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at);
