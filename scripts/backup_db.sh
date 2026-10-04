#!/usr/bin/env bash
# ==============================================================================
# TRACEVAULT V2 — POSTGRESQL LOGICAL BACKUP PROCEDURE
# CLASSIFICATION: LAW ENFORCEMENT INVESTIGATION PLATFORM (SIH26182)
# USAGE: DEVELOPMENT / DEPLOYMENT PROCEDURE
# ==============================================================================
# This script executes a consistent logical backup of the TRACEVAULT PostgreSQL database
# using pg_dump in custom directory/archive format with compression.
#
# PREREQUISITES:
#   - PostgreSQL client tools (pg_dump) installed and on PATH
#   - DATABASE_URL environment variable set OR individual PG* variables configured
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/tracevault_backup_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

echo "=========================================================="
echo " TRACEVAULT V2 — DATABASE LOGICAL BACKUP PROCEDURE"
echo "=========================================================="
echo "Target Backup Destination: ${BACKUP_FILE}"

if [ -n "${DATABASE_URL:-}" ]; then
  echo "Using DATABASE_URL connection configuration..."
  pg_dump --format=custom \
          --compress=9 \
          --no-owner \
          --no-privileges \
          --verbose \
          --file="${BACKUP_FILE}" \
          "${DATABASE_URL}"
else
  PGHOST="${PGHOST:-localhost}"
  PGPORT="${PGPORT:-5432}"
  PGUSER="${PGUSER:-postgres}"
  PGDATABASE="${PGDATABASE:-tracevault}"

  echo "Connecting to: ${PGUSER}@${PGHOST}:${PGPORT}/${PGDATABASE}..."
  pg_dump --host="${PGHOST}" \
          --port="${PGPORT}" \
          --username="${PGUSER}" \
          --dbname="${PGDATABASE}" \
          --format=custom \
          --compress=9 \
          --no-owner \
          --no-privileges \
          --verbose \
          --file="${BACKUP_FILE}"
fi

echo "----------------------------------------------------------"
echo "✓ Backup successfully created: ${BACKUP_FILE}"
echo "✓ Size: $(du -h "${BACKUP_FILE}" | cut -f1)"
echo ""
echo "VERIFICATION INSTRUCTION:"
echo "To verify archive structure without restoring data:"
echo "  pg_restore --list ${BACKUP_FILE}"
echo "=========================================================="
