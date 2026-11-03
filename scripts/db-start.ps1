param(
  [int]$Port = 5432,
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

if (-not (Test-Path (Join-Path $PgData "PG_VERSION"))) {
  throw "Data PostgreSQL tidak ditemukan di $PgData. Set PGDATA ke folder data cluster."
}

$pgCtl = Join-Path $PgBin "pg_ctl.exe"
$pgIsReady = Join-Path $PgBin "pg_isready.exe"
$log = Join-Path $PgData "postgresql-local.log"

& $pgCtl -D $PgData status *> $null
if ($LASTEXITCODE -eq 0) {
  Write-Host "PostgreSQL sudah berjalan di port $Port."
  exit 0
}

& $pgCtl -D $PgData -l $log -o "-p $Port" start
if ($LASTEXITCODE -ne 0) {
  throw "PostgreSQL gagal berjalan. Lihat $log."
}

& $pgIsReady -h 127.0.0.1 -p $Port
Write-Host "PostgreSQL siap di 127.0.0.1:$Port."
