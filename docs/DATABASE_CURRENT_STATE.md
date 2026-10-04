# TRACEVAULT Database Current State & Schema Audit

## Existing Tables

### 1. `roles`
- **Primary Key**: `id` (SERIAL)
- **Columns**: `name` (VARCHAR(50), UNIQUE, NOT NULL), `description` (TEXT), `created_at` (TIMESTAMPTZ)
- **Role**: RBAC definition table (`ADMIN`, `LEAD_INVESTIGATOR`, `INVESTIGATOR`).

### 2. `users`
- **Primary Key**: `id` (SERIAL)
- **Foreign Keys**: `role_id` -> `roles(id)` ON DELETE SET NULL
- **Columns**: `username` (VARCHAR(100), UNIQUE, NOT NULL), `email` (VARCHAR(255), UNIQUE, NOT NULL), `password_hash` (VARCHAR(255), NOT NULL), `is_active` (BOOLEAN), `last_login_at` (TIMESTAMPTZ), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Role**: Application user identity and credential management.

### 3. `cases`
- **Primary Key**: `id` (SERIAL)
- **Unique Constraint**: `case_id` (VARCHAR(64), UNIQUE, NOT NULL)
- **Columns**: `title` (VARCHAR(255), NOT NULL), `description` (TEXT), `crime_type` (VARCHAR(100)), `subject_type` (VARCHAR(50)), `subject_identifier` (VARCHAR(128)), `blockchain` (VARCHAR(50)), `priority` (CHECK: LOW, MEDIUM, HIGH, CRITICAL), `status` (CHECK: OPEN, ANALYZING, ANALYSIS_COMPLETE, REVIEW, CLOSED), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Role**: Master investigative matter record.

### 4. `case_members`
- **Primary Key**: `id` (SERIAL)
- **Foreign Keys**:
  - `case_id` -> `cases(id)` ON DELETE CASCADE
  - `user_id` -> `users(id)` ON DELETE CASCADE
- **Unique Constraint**: `UNIQUE(case_id, user_id)`
- **Columns**: `role` (VARCHAR(50)), `created_at` (TIMESTAMPTZ).
- **Role**: Multi-tenant investigator assignments to cases.

### 5. `entities`
- **Primary Key**: `id` (SERIAL)
- **Unique Constraint**: `UNIQUE(blockchain, identifier)`
- **Columns**: `identifier` (VARCHAR(128), NOT NULL), `entity_type` (CHECK: WALLET, VASP, EXCHANGE, DEPOSIT_WALLET, MIXER, INTERMEDIARY, MERCHANT, MULE_ACCOUNT, SMART_CONTRACT, UNKNOWN), `name` (VARCHAR(255)), `blockchain` (VARCHAR(50)), `risk_score` (NUMERIC(5,2)), `tags` (TEXT[]), `metadata` (JSONB), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Role**: Investigated financial entities across rails.

### 6. `vasps`
- **Primary Key**: `id` (SERIAL)
- **Unique Constraint**: `name` (VARCHAR(255), UNIQUE, NOT NULL)
- **Columns**: `source` (VARCHAR(100)), `reliability` (VARCHAR(50)), `risk_score` (NUMERIC(5,2)), `metadata` (JSONB), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Role**: Verified Virtual Asset Service Providers directory.

### 7. `entity_addresses`
- **Primary Key**: `id` (SERIAL)
- **Foreign Keys**:
  - `entity_id` -> `entities(id)` ON DELETE SET NULL
  - `vasp_id` -> `vasps(id)` ON DELETE SET NULL
- **Unique Constraint**: `UNIQUE(blockchain, address)`
- **Columns**: `address` (VARCHAR(128), NOT NULL), `blockchain` (VARCHAR(50)), `source` (VARCHAR(100)), `updated_at` (TIMESTAMPTZ).
- **Role**: Mapping of specific addresses to known entities or VASP clusters.

### 8. `wallets`
- **Primary Key**: `id` (SERIAL)
- **Foreign Keys**: `entity_id` -> `entities(id)` ON DELETE SET NULL
- **Unique Constraint**: `UNIQUE(blockchain, address)`
- **Columns**: `address` (VARCHAR(128), NOT NULL), `blockchain` (VARCHAR(50)), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Role**: Direct wallet registry index.

### 9. `transactions`
- **Primary Key**: `id` (SERIAL)
- **Unique Constraint**: `UNIQUE(blockchain, transaction_hash)`
- **Columns**: `transaction_hash` (VARCHAR(128), NOT NULL), `blockchain` (VARCHAR(50)), `timestamp` (TIMESTAMPTZ), `from_address` (VARCHAR(128), NOT NULL), `to_address` (VARCHAR(128), NOT NULL), `asset` (VARCHAR(20)), `amount` (NUMERIC(28, 8)), `transaction_type` (VARCHAR(50)), `block_number` (BIGINT), `source` (VARCHAR(100)), `metadata` (JSONB), `created_at` (TIMESTAMPTZ).
- **Role**: Financial transaction log for on-chain transfers.

### 10. `analysis_results`
- **Primary Key**: `id` (SERIAL)
- **Unique Constraint**: `analysis_id` (VARCHAR(64), UNIQUE, NOT NULL)
- **Foreign Keys**: `case_id` -> `cases(case_id)` ON DELETE CASCADE
- **Columns**: `subject` (VARCHAR(128), NOT NULL), `wallet` (VARCHAR(128), NOT NULL), `blockchain` (VARCHAR(50)), `status` (VARCHAR(50)), `nearest_vasp` (VARCHAR(255)), `confidence` (NUMERIC(5,2)), `confidence_label` (VARCHAR(30)), `analysis_payload` (JSONB, NOT NULL), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Role**: Analysis output document returned from Python intelligence engine.

### 11. `risk_results`
- **Primary Key**: `id` (SERIAL)
- **Foreign Keys**: `analysis_id` -> `analysis_results(analysis_id)` ON DELETE CASCADE
- **Columns**: `score` (NUMERIC(5,2), NOT NULL), `level` (CHECK: LOW, MEDIUM, HIGH, CRITICAL), `explanation` (TEXT), `metadata` (JSONB), `created_at` (TIMESTAMPTZ).
- **Role**: Overall risk evaluation associated with an analysis execution.

### 12. `risk_signals`
- **Primary Key**: `id` (SERIAL)
- **Foreign Keys**: `risk_result_id` -> `risk_results(id)` ON DELETE CASCADE
- **Columns**: `signal_id` (VARCHAR(64)), `signal_type` (VARCHAR(50), NOT NULL), `score` (NUMERIC(5,2)), `severity` (VARCHAR(20)), `description` (TEXT, NOT NULL), `reason` (TEXT), `entity` (VARCHAR(255)), `metadata` (JSONB), `created_at` (TIMESTAMPTZ).
- **Role**: Granular deterministic risk indicators.

### 13. `evidence`
- **Primary Key**: `id` (SERIAL)
- **Foreign Keys**:
  - `analysis_id` -> `analysis_results(analysis_id)` ON DELETE CASCADE
  - `case_id` -> `cases(case_id)` ON DELETE CASCADE
- **Columns**: `evidence_id` (VARCHAR(64), NOT NULL), `type` (VARCHAR(50), NOT NULL), `description` (TEXT, NOT NULL), `source` (VARCHAR(100)), `timestamp` (TIMESTAMPTZ), `status` (VARCHAR(50)), `relevance` (VARCHAR(20)), `transaction_hash` (VARCHAR(128)), `block_number` (BIGINT), `from_address` (VARCHAR(128)), `to_address` (VARCHAR(128)), `amount` (NUMERIC(28, 8)), `asset` (VARCHAR(20)), `entity` (VARCHAR(255)), `metadata` (JSONB), `created_at` (TIMESTAMPTZ).
- **Role**: Legal evidence register items linking case observations with immutable facts.

### 14. `reports`
- **Primary Key**: `id` (SERIAL)
- **Foreign Keys**:
  - `case_id` -> `cases(case_id)` ON DELETE CASCADE
  - `analysis_id` -> `analysis_results(analysis_id)` ON DELETE SET NULL
- **Columns**: `title` (VARCHAR(255), NOT NULL), `status` (VARCHAR(50)), `report_payload` (JSONB), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Role**: Formatted case reporting dossiers.

### 15. `disclosure_requests`
- **Primary Key**: `id` (SERIAL)
- **Unique Constraint**: `request_id` (VARCHAR(64), UNIQUE, NOT NULL)
- **Foreign Keys**:
  - `case_id` -> `cases(case_id)` ON DELETE CASCADE
  - `analysis_id` -> `analysis_results(analysis_id)` ON DELETE SET NULL
- **Columns**: `target_entity` (VARCHAR(255)), `request_type` (VARCHAR(50)), `status` (VARCHAR(50)), `request_payload` (JSONB), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Role**: SAHYOG statutory information disclosure requisitions.

### 16. `audit_logs`
- **Primary Key**: `id` (SERIAL)
- **Foreign Keys**:
  - `user_id` -> `users(id)` ON DELETE SET NULL
  - `case_id` -> `cases(case_id)` ON DELETE SET NULL
- **Columns**: `action` (VARCHAR(100), NOT NULL), `resource_type` (VARCHAR(50), NOT NULL), `resource_id` (VARCHAR(128)), `metadata` (JSONB), `created_at` (TIMESTAMPTZ).
- **Role**: Append-only security audit log recording system access and forensic actions.

---

## Relationships Diagram (Conceptual)
```
[roles] <── [users] <── [case_members] ──> [cases]
                             │                 │
                             │                 ├──> [analysis_results]
                             │                 │         ├──> [risk_results] ──> [risk_signals]
                             │                 │         ├──> [evidence]
                             │                 │         ├──> [reports]
                             │                 │         └──> [disclosure_requests]
                             │                 │
                             │                 └──> [audit_logs]
                             │
[vasps] <── [entity_addresses] ──> [entities] <── [wallets]
                                                  [transactions]
```

---

## Indexes
- Implicit unique indexes on all primary keys and unique columns (`cases.case_id`, `users.username`, `users.email`, `analysis_results.analysis_id`, `disclosure_requests.request_id`, `entities(blockchain, identifier)`).
- Migration 009 indexes `transactions(blockchain, transaction_hash)`.

---

## Constraints
- Priority enum checks on `cases.priority` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- Status enum checks on `cases.status` (`OPEN`, `ANALYZING`, `ANALYSIS_COMPLETE`, `REVIEW`, `CLOSED`).
- Risk level enum checks on `risk_results.level` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- Entity type enum checks on `entities.entity_type`.

---

## Missing Persistence
1. **Dedicated UPI Transactions Table**: Currently, domestic UPI rails are stored either in the Python mock adapter or embedded inside `transactions.metadata JSONB`. A first-class normalized UPI transaction structure or rail column is not yet separated into its own table.
2. **Geospatial Signals Table**: Geospatial telemetry records are evaluated in memory inside the Python engine without dedicated PostgreSQL persistence tables.
3. **Investigation Run Registry**: Phase 16 unified investigations (`INVESTIGATION_REGISTRY`) reside in Python memory rather than being persisted in an `investigations` PostgreSQL table.

---

## Migration Risks
- Updating `entities.entity_type` enum in SQL requires altering the check constraint to avoid `MULE_ACCOUNT` terminology in favor of neutral labels (`RECIPIENT_ACCOUNT`, `HIGH_VELOCITY_ACCOUNT`).
- Adding first-class rail support to `transactions` will require a non-breaking migration (e.g. `018_add_rail_to_transactions.sql`) with default value `'ethereum'`.
