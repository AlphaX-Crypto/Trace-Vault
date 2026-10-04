-- 003_create_cases.sql
CREATE TABLE IF NOT EXISTS cases (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    crime_type VARCHAR(100) DEFAULT 'GENERAL_INVESTIGATION',
    subject_type VARCHAR(50) DEFAULT 'WALLET',
    subject_identifier VARCHAR(128),
    blockchain VARCHAR(50) DEFAULT 'ethereum',
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ANALYZING', 'ANALYSIS_COMPLETE', 'REVIEW', 'CLOSED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cases_case_id ON cases(case_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);
