-- 001_dev_seeds.sql: Development & Demonstration Seed Intelligence Data
-- CLEARLY LABELED: DEV / TEST DATA ONLY (No production credentials or secrets)

-- 1. Roles
INSERT INTO roles (name, description)
VALUES 
    ('INVESTIGATOR', 'Law Enforcement Cybercrime Investigator'),
    ('SUPERVISOR', 'Supervisory Officer / Reviewing Authority'),
    ('ADMIN', 'System Administrator')
ON CONFLICT (name) DO NOTHING;

-- 2. Dev User Placeholder
INSERT INTO users (username, email, password_hash, role_id)
VALUES (
    'investigator_demo',
    'officer@tracevault.internal',
    '$2b$12$placeholderHashForPhase7AuthenticationOnly',
    (SELECT id FROM roles WHERE name = 'INVESTIGATOR')
)
ON CONFLICT (username) DO NOTHING;

-- 3. Controlled Test VASPs
INSERT INTO vasps (name, source, reliability, risk_score, metadata)
VALUES ('Example Exchange', 'controlled_test_registry', 'VERIFIED', 15.0, '{"jurisdiction": "Test Sandbox", "type": "CENTRALIZED_EXCHANGE"}')
ON CONFLICT (name) DO NOTHING;

-- 4. Controlled Test Entities
INSERT INTO entities (identifier, entity_type, name, blockchain, risk_score, tags, metadata)
VALUES 
    ('exchange_deposit', 'DEPOSIT_WALLET', 'Example Exchange Deposit Wallet', 'ethereum', 15.0, ARRAY['deposit_wallet', 'exchange'], '{"vasp": "Example Exchange"}'),
    ('mixer_1', 'MIXER', 'Tornado Cash Mock', 'ethereum', 95.0, ARRAY['privacy_protocol', 'mixer'], '{"type": "SMART_CONTRACT"}')
ON CONFLICT (blockchain, identifier) DO UPDATE 
SET name = EXCLUDED.name, risk_score = EXCLUDED.risk_score;

-- 5. Entity Addresses Mapping
INSERT INTO entity_addresses (entity_id, vasp_id, address, blockchain, source)
VALUES 
    ((SELECT id FROM entities WHERE identifier = 'exchange_deposit'), (SELECT id FROM vasps WHERE name = 'Example Exchange'), 'exchange_deposit', 'ethereum', 'controlled_test_registry'),
    ((SELECT id FROM entities WHERE identifier = 'exchange_deposit'), (SELECT id FROM vasps WHERE name = 'Example Exchange'), '0xexchange_deposit', 'ethereum', 'controlled_test_registry')
ON CONFLICT (blockchain, address) DO NOTHING;

-- 6. Demo Investigation Case
INSERT INTO cases (case_id, title, description, crime_type, priority, subject_type, blockchain, subject_identifier, status)
VALUES (
    'CASE-2026-001',
    'Operation CryptoSweep - Ransomware Cluster',
    'Tracing unhosted wallet associated with multi-stage ransomware extortion.',
    'RANSOMWARE',
    'HIGH',
    'WALLET',
    'ethereum',
    '0x0000000000000000000000000000000000000001',
    'OPEN'
)
ON CONFLICT (case_id) DO NOTHING;
