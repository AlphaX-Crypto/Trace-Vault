-- 001_dev_seeds.sql: Development & Demonstration Seed Intelligence Data
-- CLEARLY LABELED: DEV / TEST DATA ONLY (No production credentials or secrets)

-- 1. Roles
INSERT INTO roles (name, description)
VALUES 
    ('INVESTIGATOR', 'Law Enforcement Cybercrime Investigator'),
    ('SUPERVISOR', 'Supervisory Officer / Reviewing Authority'),
    ('ADMIN', 'System Administrator')
ON CONFLICT (name) DO NOTHING;

-- 2. Dev Seed Users (DEVELOPMENT / TEST ONLY - Never used in production)
INSERT INTO users (username, email, password_hash, role_id, is_active)
VALUES 
    (
        'investigator',
        'investigator@tracevault.local',
        '$2b$10$Lto5SnvUE/F6sZV.5JIagei.WaB16fZiBfZUuVDXzHHZB0VkAJzUS',
        (SELECT id FROM roles WHERE name = 'INVESTIGATOR'),
        TRUE
    ),
    (
        'supervisor',
        'supervisor@tracevault.local',
        '$2b$10$7XUoHMu2nBzt6pmBQD5saOAqWhpMNIm3LevkqwM8SNYKckwR37UZi',
        (SELECT id FROM roles WHERE name = 'SUPERVISOR'),
        TRUE
    ),
    (
        'admin',
        'admin@tracevault.local',
        '$2b$10$qA5OqN2fOss7ph3IgB0aS.HKIMqkjuOmJH5xUts518vw1H/nSkYEq',
        (SELECT id FROM roles WHERE name = 'ADMIN'),
        TRUE
    )
ON CONFLICT (username) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    email = EXCLUDED.email,
    role_id = EXCLUDED.role_id,
    is_active = EXCLUDED.is_active;

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

-- 6. Demo Investigation Cases
INSERT INTO cases (case_id, title, description, crime_type, priority, subject_type, blockchain, subject_identifier, status)
VALUES 
    (
        'CASE-2026-001',
        'Operation CryptoSweep - Ransomware Cluster',
        'Tracing unhosted wallet associated with multi-stage ransomware extortion.',
        'RANSOMWARE',
        'HIGH',
        'WALLET',
        'ethereum',
        'A',
        'OPEN'
    ),
    (
        'CASE-2026-002',
        'Operation ShadowLoot - Exchange Exit Scoping',
        'Forensic attribution of illicit fund flow terminating in centralized VASP deposit cluster.',
        'THEFT',
        'MEDIUM',
        'WALLET',
        'ethereum',
        'B',
        'OPEN'
    )
ON CONFLICT (case_id) DO NOTHING;

-- 7. Case Assignment (Assign demo investigator to demo cases)
INSERT INTO case_members (case_id, user_id, role)
VALUES 
    (
        (SELECT id FROM cases WHERE case_id = 'CASE-2026-001'),
        (SELECT id FROM users WHERE username = 'investigator'),
        'INVESTIGATOR'
    ),
    (
        (SELECT id FROM cases WHERE case_id = 'CASE-2026-002'),
        (SELECT id FROM users WHERE username = 'investigator'),
        'INVESTIGATOR'
    )
ON CONFLICT (case_id, user_id) DO NOTHING;


