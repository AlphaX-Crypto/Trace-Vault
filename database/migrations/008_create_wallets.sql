-- 008_create_wallets.sql
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    address VARCHAR(128) NOT NULL,
    blockchain VARCHAR(50) DEFAULT 'ethereum',
    entity_id INTEGER REFERENCES entities(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blockchain, address)
);

CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
CREATE INDEX IF NOT EXISTS idx_wallets_blockchain ON wallets(blockchain);
CREATE INDEX IF NOT EXISTS idx_wallets_entity_id ON wallets(entity_id);
