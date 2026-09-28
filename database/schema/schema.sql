-- TRACEVAULT V2 — Complete PostgreSQL Database Schema
-- Canonical Source of Truth for Investigation State

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS case_members (
    id SERIAL PRIMARY KEY,
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'INVESTIGATOR',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(case_id, user_id)
);

CREATE TABLE IF NOT EXISTS entities (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(128) NOT NULL,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('WALLET', 'VASP', 'EXCHANGE', 'DEPOSIT_WALLET', 'MIXER', 'INTERMEDIARY', 'MERCHANT', 'MULE_ACCOUNT', 'SMART_CONTRACT', 'UNKNOWN')),
    name VARCHAR(255),
    blockchain VARCHAR(50) DEFAULT 'ethereum',
    risk_score NUMERIC(5,2) DEFAULT 0.0,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blockchain, identifier)
);

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

CREATE TABLE IF NOT EXISTS entity_addresses (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES entities(id) ON DELETE SET NULL,
    vasp_id INTEGER REFERENCES vasps(id) ON DELETE SET NULL,
    address VARCHAR(128) NOT NULL,
    blockchain VARCHAR(50) DEFAULT 'ethereum',
    source VARCHAR(100) DEFAULT 'controlled_test_registry',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blockchain, address)
);

CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    address VARCHAR(128) NOT NULL,
    blockchain VARCHAR(50) DEFAULT 'ethereum',
    entity_id INTEGER REFERENCES entities(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blockchain, address)
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(128) NOT NULL,
    blockchain VARCHAR(50) DEFAULT 'ethereum',
    timestamp TIMESTAMPTZ,
    from_address VARCHAR(128) NOT NULL,
    to_address VARCHAR(128) NOT NULL,
    asset VARCHAR(20) DEFAULT 'ETH',
    amount NUMERIC(28, 8) DEFAULT 0.0,
    transaction_type VARCHAR(50) DEFAULT 'transfer',
    block_number BIGINT,
    source VARCHAR(100) DEFAULT 'blockchain',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blockchain, transaction_hash)
);

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

CREATE TABLE IF NOT EXISTS risk_results (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(64) NOT NULL REFERENCES analysis_results(analysis_id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    explanation TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    analysis_id VARCHAR(64) REFERENCES analysis_results(analysis_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT',
    report_payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    case_id VARCHAR(64) REFERENCES cases(case_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(128),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
