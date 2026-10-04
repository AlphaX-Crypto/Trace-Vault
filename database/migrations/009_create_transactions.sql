-- 009_create_transactions.sql
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

CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_blockchain ON transactions(blockchain);
