param(
  [string]$PgBin = $env:PGBIN,
  [string]$PgData = $env:PGDATA
)

$ErrorActionPreference = "Stop"

if (-not $PgBin) {
  $candidate = Join-Path $env:USERPROFILE "pgsql\17\bin"
  if (Test-Path (Join-Path $candidate "pg_ctl.exe")) {
    $PgBin = $candidate
  }
}

if (-not $PgBin) {
  $candidate = "C:\Program Files\PostgreSQL\17\bin"
  if (Test-Path (Join-Path $candidate "pg_ctl.exe")) {
    $PgBin = $candidate
  }
}

if (-not $PgBin) {
  throw "pg_ctl tidak ditemukan. Set PGBIN ke folder bin PostgreSQL."
}

if (-not $PgData) {
  $PgData = Join-Path (Split-Path -Parent $PgBin) "data"
}

$pgCtl = Join-Path $PgBin "pg_ctl.exe"

& $pgCtl -D $PgData status *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "PostgreSQL tidak sedang berjalan."
  exit 0
}

& $pgCtl -D $PgData stop -m fast
Write-Host "PostgreSQL berhenti."
