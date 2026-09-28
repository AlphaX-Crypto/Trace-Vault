# TRACEVAULT V2 — SECURITY ARCHITECTURE & OPERATIONAL HARDENING

**Classification:** Law Enforcement Financial Investigation Platform (SIH26182)  
**Document Revision:** 2.0.0 (Phase 8 Production Hardening)  
**Status:** Approved for Operational Evaluation  

---

## 1. Executive Security Architecture

TRACEVAULT is an automated blockchain intelligence and VASP attribution engine designed to support law enforcement agencies (LEAs) in cryptocurrency financial fraud investigations. Because investigation records, wallet attributions, and Section 91 CrPC requisition requests involve sensitive legal casework, security is enforced across every layer of the architecture:

```
[ Ingress: Reverse Proxy / TLS ]
           │
           ▼
[ Helmet Security Headers + Strict IP Rate Limiters ]
           │
           ▼
[ Security Scanner Middleware (Hex Private Key & Seed Phrase Blocker) ]
           │
           ▼
[ JWT Authentication & Revocation Verification ]
           │
           ▼
[ Role-Based Access Control (RBAC Permission Matrix) ]
           │
           ▼
[ Case-Level Membership Authorization (case_members Scoping) ]
           │
           ▼
[ Parameterized PostgreSQL Persistence & Append-Only Audit Trail ]
           │
           ▼
[ Isolated FastAPI Python Engine (NetworkX Graph & VASP Attribution) ]
```

---

## 2. Authentication & Session Management

### 2.1 Password Hashing Policy
- **Algorithm:** Bcrypt with 10 salt rounds.
- **Terminology:** Passwords are cryptographically **hashed** with salt, never "encrypted".
- **Policy:** Minimum 8 characters. In production, policies should enforce 12+ characters with alphanumeric and special characters.
- **Protection:** Plaintext passwords are never stored, never logged in audit trails, never included in logs, and strictly omitted from all user object representations returned by the API (`password_hash` column is explicitly excluded in queries).

### 2.2 JWT Session Lifecycle
- **Algorithm:** HMAC-SHA256 (`HS256`).
- **Standard Claims:**
  - `iss`: `tracevault-engine` (Issuer verification enforced)
  - `aud`: `tracevault-client` (Audience verification enforced)
  - `jti`: RFC 7519 unique UUID per token to prevent collision and enable precise revocation
  - `exp`: Default 2 hours (`2h`)
- **Signature Verification:** All protected endpoints strictly verify token signature and expiry before granting request access.

### 2.3 Token Revocation
- When an investigator or officer logs out via `POST /api/auth/logout`, the token string and its unique `jti` are registered in an in-memory revocation blocklist.
- Any subsequent attempt to present a revoked token returns `HTTP 401 Unauthorized` with error code `TOKEN_REVOKED`.
- Expired tokens in the blocklist are automatically pruned on a continuous sliding window matching token lifetime.

### 2.4 Token Storage & Known Limitation
> [!WARNING] Architectural Trade-off & Security Limitation
> In the current browser implementation, JWT tokens are stored in `sessionStorage` (or `localStorage` when "Remember session" is selected) to facilitate cross-port development and decoupled API consumption.
>
> **Known Limitation:** Browser storage mechanisms (`localStorage`/`sessionStorage`) are accessible to JavaScript running within the origin context and vulnerable to hypothetical Cross-Site Scripting (XSS) compromise.
>
> **Production Hardening Recommendation:**  
> For production deployment behind an authoritative reverse proxy (e.g., NGINX / Envoy) on a single unified origin:
> 1. Migrate token transport to `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
> 2. Ensure JavaScript has zero direct access to session credentials.
> 3. Implement Anti-CSRF token verification (`Double-Submit Cookie` or `SameSite=Strict`) for all state-changing operations (`POST`, `PUT`, `DELETE`).

---

## 3. Role-Based Access Control (RBAC)

TRACEVAULT implements deterministic Role-Based Access Control with three discrete law enforcement roles:

```
            [ ADMIN ] ── System administration, user lifecycle management, unconstrained case oversight
               │
         [ SUPERVISOR ] ── Case review, supervisor assignment, Section 91 CrPC approval, unconstrained case oversight
               │
        [ INVESTIGATOR ] ── Assigned case investigation, analysis execution, evidence inspection, dossier export
```

### Permission Matrix
| Permission Code | Description | INVESTIGATOR | SUPERVISOR | ADMIN |
| :--- | :--- | :---: | :---: | :---: |
| `case:create` | Create new investigative casework | ✅ | ✅ | ✅ |
| `case:view_assigned` | Access cases explicitly assigned to the user | ✅ | ✅ | ✅ |
| `case:view_all` | Access any case across the entire registry | ❌ | ✅ | ✅ |
| `case:edit` | Update case metadata, status, and summary | ✅ | ✅ | ✅ |
| `case:close` | Mark an active investigation as closed | ❌ | ✅ | ✅ |
| `case:assign` | Assign team members and secondary officers | ❌ | ✅ | ✅ |
| `analysis:run` | Dispatch graph traversal and VASP attribution | ✅ | ✅ | ✅ |
| `evidence:view` | Inspect transaction evidence chains | ✅ | ✅ | ✅ |
| `report:export` | Export investigative dossiers | ✅ | ✅ | ✅ |
| `disclosure:request` | Draft Section 91 CrPC disclosure notices | ✅ | ✅ | ✅ |
| `disclosure:approve` | Authorize formal disclosure requests | ❌ | ✅ | ✅ |
| `user:manage` | Create, activate, and deactivate users | ❌ | ❌ | ✅ |
| `audit:view` | Inspect system-wide audit records | ❌ | ✅ | ✅ |

---

## 4. Case-Level Authorization

Horizontal privilege escalation between investigators is strictly prevented:
1. **Membership Verification:** When an investigator requests access to `/api/cases/:caseId/*`, the `requireCaseAccess` middleware checks the `case_members` table in PostgreSQL.
2. **Supervisor Bypass:** Users with role `SUPERVISOR` or `ADMIN` are granted systemic oversight across all registered cases.
3. **Denial & Auditing:** Unauthorized attempts to access a case return `HTTP 403 Forbidden` (`FORBIDDEN_CASE_ACCESS`) and are immediately recorded in the audit trail as `PERMISSION_DENIED`.
4. **Scoped Listings:** The `GET /api/cases` endpoint automatically filters casework to only return cases assigned to the authenticated user.

---

## 5. Append-Only Application Audit Trail

> [!NOTE] Precise Legal & Technical Terminology
> Audit logging in TRACEVAULT is an **append-only application audit trail**. It is not cryptographically immutable unless external immutable hardware (WORM storage / signed ledger) is configured at the infrastructure tier. Do not claim cryptographic immutability.

### 5.1 Monitored Events
All critical investigation actions are recorded in the `audit_logs` table:
- `LOGIN_SUCCESS`: Successful authentication
- `LOGIN_FAILED`: Failed login attempt (invalid password or unknown user)
- `LOGOUT`: Explicit session termination
- `PERMISSION_DENIED`: Missing RBAC permission or unauthorized case access
- `CASE_CREATED`: New investigation intake
- `CASE_VIEWED`: Investigation record accessed
- `ANALYSIS_STARTED`: Blockchain graph traversal initiated
- `ANALYSIS_COMPLETED`: Attribution and risk calculation finished
- `ANALYSIS_FAILED`: Graph traversal failure or upstream error
- `EVIDENCE_VIEWED`: Forensic evidence inspection
- `REPORT_GENERATED`: Dossier export generated
- `DISCLOSURE_REQUESTED`: Section 91 CrPC disclosure notice drafted

### 5.2 Metadata Sanitization
The `AuditRepository` executes automatic recursive redaction on all metadata payloads. Any key matching `/password|secret|token|private_key|seed_phrase/i` or values matching 64-character hexadecimal private keys are replaced with `[REDACTED]`, ensuring sensitive credentials never enter database logs.

---

## 6. Input Scanning & Credential Protection

The global `securityScanMiddleware` inspects all inbound HTTP request bodies, URL query parameters, and custom headers:
1. **Private Key Detection:** Rejects any input containing 64-character hexadecimal strings matching cryptocurrency private keys (`SECURITY_VIOLATION_PRIVATE_KEY`).
2. **Seed Phrase Detection:** Rejects inputs matching 12-to-24 word BIP-39 mnemonic seed phrases (`SECURITY_VIOLATION_SEED_PHRASE`).
3. **Prohibited Key Fields:** Blocks requests with sensitive field names (`private_key`, `secret_phrase`, `mnemonic`) outside legitimate auth endpoints.

---

## 7. Rate Limiting Policy

Rate limiting is enforced at ingress using `express-rate-limit`:

| Route / Limiter | Window | Max Requests | Violation Code | Action |
| :--- | :--- | :--- | :--- | :--- |
| `POST /api/auth/login` | 15 minutes | 10 | `RATE_LIMIT_EXCEEDED` | 429 Too Many Requests |
| `POST /api/cases/:id/analyze` | 10 minutes | 20 | `RATE_LIMIT_EXCEEDED` | 429 Too Many Requests |
| `POST /api/cases/:id/disclosure-request` | 10 minutes | 30 | `RATE_LIMIT_EXCEEDED` | 429 Too Many Requests |
| Global `/api/*` Ingress | 15 minutes | 300 | `RATE_LIMIT_EXCEEDED` | 429 Too Many Requests |

### Reverse Proxy & IP Resolution
When deployed behind an enterprise reverse proxy (e.g. NGINX, Cloudflare, AWS ALB), set `TRUST_PROXY=true` in `.env`. This configures Express to trust the `X-Forwarded-For` header from the immediate proxy.

---

## 8. Security Headers & CORS

### 8.1 Helmet Headers
- `X-Frame-Options: SAMEORIGIN` (prevents clickjacking attacks)
- `X-Content-Type-Options: nosniff` (prevents MIME-type confusion attacks)
- `Referrer-Policy: strict-origin-when-cross-origin` (prevents URL path leakage)
- `Strict-Transport-Security (HSTS)`: Enabled in production (`maxAge: 31536000; includeSubDomains; preload`)

### 8.2 CORS Configuration
- In **development**, CORS permits `http://localhost:5173` with credentials.
- In **production**, wildcard origins (`*`) are strictly prohibited and startup validation will fail if configured. A specific FQDN origin (e.g. `https://tracevault.gov.in`) must be supplied.

---

## 9. Observability & Request Correlation

Every request traversing the TRACEVAULT stack is tagged with a correlation identifier:
1. An incoming `X-Request-ID` is preserved, or a UUID is generated (`crypto.randomUUID()`).
2. The ID is injected into response headers (`X-Request-ID: <uuid>`).
3. Outbound requests to the Python Intelligence Engine include `X-Request-ID`.
4. Structured log messages include `requestId`, `method`, `url`, `statusCode`, `durationMs`, and `userId` (when authenticated).
5. No passwords, private keys, or raw JWT tokens are ever logged.

---

## 10. Database Hardening & Least-Privilege Access

### 10.1 SQL Parameterization
All SQL operations throughout TRACEVAULT utilize parameterized queries (`$1, $2, ...`) via the Node.js `pg` driver. String interpolation into SQL statements is prohibited, eliminating SQL injection vectors.

### 10.2 Least-Privilege Production User Architecture
In production, do not run the application as the PostgreSQL superuser (`postgres`). Create dedicated database users:

```sql
-- 1. Application User (Read/Write)
CREATE USER tv_app_user WITH PASSWORD 'STRONG_RANDOMLY_GENERATED_PASSWORD';
GRANT CONNECT ON DATABASE tracevault TO tv_app_user;
GRANT USAGE ON SCHEMA public TO tv_app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO tv_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tv_app_user;

-- Revoke dangerous administrative privileges
REVOKE CREATE ON SCHEMA public FROM tv_app_user;
REVOKE DROP ON ALL TABLES IN SCHEMA public FROM tv_app_user;

-- 2. Backup User (Read-Only)
CREATE USER tv_backup_user WITH PASSWORD 'STRONG_BACKUP_PASSWORD';
GRANT CONNECT ON DATABASE tracevault TO tv_backup_user;
GRANT USAGE ON SCHEMA public TO tv_backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO tv_backup_user;
```

---

## 11. Database Backup & Recovery Procedure

> **Classification:** DEVELOPMENT / DEPLOYMENT PROCEDURE  
> Automated backups are not run destructively. Use the provided verified procedures:

### Logical Backup Command
```bash
# Using Bash (Linux / Docker):
./scripts/backup_db.sh

# Using PowerShell (Windows):
.\scripts\backup_db.ps1
```
Backups are produced using `pg_dump` with custom archive compression (`--format=custom --compress=9`).

### Archive Verification Command
```bash
# Verify archive contents without modifying database
pg_restore --list ./backups/tracevault_backup_YYYYMMDD_HHMMSS.dump
```

### Verified Restoration Command
```bash
# Using Bash:
./scripts/restore_db.sh ./backups/tracevault_backup_YYYYMMDD_HHMMSS.dump target_db_name

# Using PowerShell:
.\scripts\restore_db.ps1 -BackupFile ./backups/tracevault_backup_YYYYMMDD_HHMMSS.dump -TargetDatabase target_db_name
```

---

## 12. Service Health & Readiness Probes

Health endpoints do not expose database connection strings, credentials, or internal stack traces:

| Endpoint | Type | Purpose | HTTP Success / Degraded |
| :--- | :--- | :--- | :---: |
| `GET /health` | Liveness | Verifies Express event loop and process status | `200 OK` |
| `GET /health/ready` | Readiness | Verifies database connectivity AND Python engine availability | `200 OK` / `503 Service Unavailable` |
| `GET /health/database` | Component | Safe latency and connection check (`SELECT 1`) | `200 OK` / `503 Service Unavailable` |
| `GET /health/intelligence` | Component | Python FastAPI reachability and engine version | `200 OK` / `503 Service Unavailable` |

---

## 13. SIH Demo Credentials & Disclaimers

### Development Accounts (DEV ONLY)
The following seed accounts are provided strictly for demonstration and testing:
- **Investigator:** `investigator` / `Investigator@123` (Role: `INVESTIGATOR`)
- **Supervisor:** `supervisor` / `Supervisor@123` (Role: `SUPERVISOR`)
- **Admin:** `admin` / `Admin@123` (Role: `ADMIN`)

> [!CAUTION] Production Credential Removal
> For production deployment, delete or rotate all seed user passwords immediately. Run:
> `UPDATE users SET password_hash = '$2a$10$...' WHERE username IN ('investigator', 'supervisor', 'admin');`

### Technical Disclaimers
1. **VASP Attribution:** Attribution is probabilistic and heuristic-based. TRACEVAULT reports potential VASP association based on on-chain clustering and behavioral patterns; it does not claim certified real-world ownership.
2. **Verification Hashes:** Hashes displayed for evidence and transactions represent algorithmic verification checksums, not statutory digital signatures.
3. **Disclosure Requests:** Section 91 CrPC notices are generated in **DRAFT** state for officer review and legal dispatch; TRACEVAULT does not claim automated electronic submission to live external LEA portals.
