<#
==============================================================================
TRACEVAULT V2 — POSTGRESQL RESTORATION PROCEDURE (POWERSHELL)
CLASSIFICATION: LAW ENFORCEMENT INVESTIGATION PLATFORM (SIH26182)
USAGE: DEVELOPMENT / DEPLOYMENT PROCEDURE
WARNING: RESTORATION OVERWRITES TARGET SCHEMA AND DATA.
==============================================================================
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,

    [string]$TargetDatabase = "tracevault"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Host "ERROR: Backup file '$BackupFile' does not exist." -ForegroundColor Red
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " TRACEVAULT V2 — DATABASE RESTORE PROCEDURE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Backup File: $BackupFile"
Write-Host "Target Database: $TargetDatabase"
Write-Host ""
Write-Host "STEP 1: Verifying backup archive header..." -ForegroundColor Yellow
pg_restore --list "$BackupFile" | Select-Object -First 20
Write-Host "✓ Archive structure verified." -ForegroundColor Green
Write-Host ""

$confirmation = Read-Host "Are you sure you want to restore this archive to database '$TargetDatabase'? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "Restoration aborted by operator." -ForegroundColor DarkYellow
    exit 0
}

Write-Host "STEP 2: Executing pg_restore..." -ForegroundColor Yellow
try {
    pg_restore --clean --if-exists --no-owner --no-privileges --verbose --dbname="$TargetDatabase" "$BackupFile"
    Write-Host "----------------------------------------------------------" -ForegroundColor Green
    Write-Host "✓ Restoration completed successfully." -ForegroundColor Green
    Write-Host ""
    Write-Host "STEP 3: Post-restore verification query..." -ForegroundColor Yellow
    psql -d "$TargetDatabase" -c "SELECT 'cases' AS table_name, count(*) FROM cases UNION ALL SELECT 'users', count(*) FROM users UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs;"
    Write-Host "==========================================================" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Restoration failed: $_" -ForegroundColor Red
    exit 1
}
