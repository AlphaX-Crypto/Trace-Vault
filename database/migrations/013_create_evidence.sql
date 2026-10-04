-- 013_create_evidence.sql
CREATE TABLE IF NOT EXISTS evidence (
    id SERIAL PRIMARY KEY,
    evidence_id VARCHAR(64) NOT NULL,
    analysis_id VARCHAR(64) NOT NULL REFERENCES analysis_results(analysis_id) ON DELETE CASCADE,
    case_id VARCHAR(64) NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    source VARCHAR(100) DEFAULT 'blockchain',
    timestamp TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'Verified',
    relevance VARCHAR(20) DEFAULT 'HIGH',
    transaction_hash VARCHAR(128),
    block_number BIGINT,
    from_address VARCHAR(128),
    to_address VARCHAR(128),
    amount NUMERIC(28, 8),
    asset VARCHAR(20),
    entity VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidence_analysis_id ON evidence(analysis_id);
CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence(type);
CREATE INDEX IF NOT EXISTS idx_evidence_tx_hash ON evidence(transaction_hash);
