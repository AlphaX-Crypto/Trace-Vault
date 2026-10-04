<#
==============================================================================
TRACEVAULT V2 — POSTGRESQL LOGICAL BACKUP PROCEDURE (POWERSHELL)
CLASSIFICATION: LAW ENFORCEMENT INVESTIGATION PLATFORM (SIH26182)
USAGE: DEVELOPMENT / DEPLOYMENT PROCEDURE
==============================================================================
This script executes a consistent logical backup of the TRACEVAULT PostgreSQL database
using pg_dump in custom directory/archive format with compression.
#>

[CmdletBinding()]
param (
    [string]$BackupDir = "./backups",
    [string]$DatabaseUrl = $env:DATABASE_URL
)

$ErrorActionPreference = "Stop"

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutputFile = Join-Path $BackupDir "tracevault_backup_$Timestamp.dump"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " TRACEVAULT V2 — DATABASE LOGICAL BACKUP PROCEDURE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target Destination: $OutputFile"

try {
    if ($DatabaseUrl) {
        Write-Host "Using DATABASE_URL connection configuration..."
        pg_dump --format=custom --compress=9 --no-owner --no-privileges --verbose --file="$OutputFile" "$DatabaseUrl"
    } else {
        $PgHost = if ($env:PGHOST) { $env:PGHOST } else { "localhost" }
        $PgPort = if ($env:PGPORT) { $env:PGPORT } else { "5432" }
        $PgUser = if ($env:PGUSER) { $env:PGUSER } else { "postgres" }
        $PgDb = if ($env:PGDATABASE) { $env:PGDATABASE } else { "tracevault" }

        Write-Host "Connecting to: $PgUser@$PgHost:$PgPort/$PgDb..."
        pg_dump --host="$PgHost" --port="$PgPort" --username="$PgUser" --dbname="$PgDb" --format=custom --compress=9 --no-owner --no-privileges --verbose --file="$OutputFile"
    }

    Write-Host "----------------------------------------------------------" -ForegroundColor Green
    Write-Host "✓ Backup successfully created: $OutputFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "VERIFICATION INSTRUCTION:" -ForegroundColor Yellow
    Write-Host "To verify archive structure without restoring data:"
    Write-Host "  pg_restore --list $OutputFile"
    Write-Host "==========================================================" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: pg_dump execution failed: $_" -ForegroundColor Red
    exit 1
}
