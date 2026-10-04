-- 006_create_vasps.sql
CREATE TABLE IF NOT EXISTS vasps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    source VARCHAR(100) DEFAULT 'controlled_test_registry',
    reliability VARCHAR(50) DEFAULT 'VERIFIED',
    risk_score NUMERIC(5,2) DEFAULT 0.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vasps_name ON vasps(name);
CREATE INDEX IF NOT EXISTS idx_vasps_reliability ON vasps(reliability);
