-- 007_create_entity_addresses.sql
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

CREATE INDEX IF NOT EXISTS idx_entity_addresses_address ON entity_addresses(address);
CREATE INDEX IF NOT EXISTS idx_entity_addresses_entity_id ON entity_addresses(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_addresses_vasp_id ON entity_addresses(vasp_id);
