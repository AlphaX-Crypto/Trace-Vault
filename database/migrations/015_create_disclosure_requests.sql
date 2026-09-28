-- 015_create_disclosure_requests.sql
CREATE TABLE IF NOT EXISTS disclosure_requests (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(64) UNIQUE NOT NULL,
    case_id VARCHAR(64) NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    analysis_id VARCHAR(64) REFERENCES analysis_results(analysis_id) ON DELETE SET NULL,
    target_entity VARCHAR(255),
    request_type VARCHAR(50) DEFAULT 'SECTION_91_CRPC',
    status VARCHAR(50) DEFAULT 'DRAFTED_PENDING_DISPATCH',
    request_payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disclosure_requests_req_id ON disclosure_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_disclosure_requests_case_id ON disclosure_requests(case_id);
