-- 005_create_entities.sql
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

CREATE INDEX IF NOT EXISTS idx_entities_identifier ON entities(identifier);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_blockchain ON entities(blockchain);
