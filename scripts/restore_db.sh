#!/usr/bin/env bash
# ==============================================================================
# TRACEVAULT V2 — POSTGRESQL RESTORATION PROCEDURE
# CLASSIFICATION: LAW ENFORCEMENT INVESTIGATION PLATFORM (SIH26182)
# USAGE: DEVELOPMENT / DEPLOYMENT PROCEDURE
# WARNING: RESTORATION OVERWRITES TARGET SCHEMA AND DATA.
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <path_to_backup_file.dump> [target_database_name]"
  echo "Example: $0 ./backups/tracevault_backup_20260928_120000.dump tracevault_recovery"
  exit 1
fi

BACKUP_FILE="$1"
TARGET_DB="${2:-tracevault}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "ERROR: Backup file '${BACKUP_FILE}' not found."
  exit 1
fi

echo "=========================================================="
echo " TRACEVAULT V2 — DATABASE RESTORE PROCEDURE"
echo "=========================================================="
echo "Backup File: ${BACKUP_FILE}"
echo "Target Database: ${TARGET_DB}"
echo ""
echo "STEP 1: Verifying backup archive header..."
pg_restore --list "${BACKUP_FILE}" | head -n 20
echo "✓ Archive structure verified."
echo ""
read -p "Are you sure you want to restore this archive to database '${TARGET_DB}'? (yes/no): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
  echo "Restoration aborted by operator."
  exit 0
fi

echo "STEP 2: Executing pg_restore..."
pg_restore --clean \
           --if-exists \
           --no-owner \
           --no-privileges \
           --verbose \
           --dbname="${TARGET_DB}" \
           "${BACKUP_FILE}"

echo "----------------------------------------------------------"
echo "✓ Restoration completed successfully."
echo ""
echo "STEP 3: Post-restore verification query..."
psql -d "${TARGET_DB}" -c "SELECT 'cases' AS table_name, count(*) FROM cases UNION ALL SELECT 'users', count(*) FROM users UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs;"
echo "=========================================================="
