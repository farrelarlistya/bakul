# Bagikan Bakul ke perangkat lain lewat Cloudflare Quick Tunnel.
# Jalankan dari root repo setelah `npm run dev` menyala:
#   npm run share
#
# Cloudflared diunduh ke %LOCALAPPDATA%\bakul (di luar repo) bila belum ada.
# Tautan bersifat publik dan berganti setiap kali tunnel dijalankan ulang.

param(
  [string]$Target = "http://127.0.0.1:3000"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Resolve-Cloudflared {
  $fromPath = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($fromPath) {
    return $fromPath.Source
  }

  $local = Join-Path $env:LOCALAPPDATA "bakul\cloudflared.exe"
  if (Test-Path -LiteralPath $local) {
    return $local
  }

  Write-Host "cloudflared belum ada. Mengunduh versi Windows 64-bit..." -ForegroundColor Yellow
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $local) | Out-Null

  $url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
  Invoke-WebRequest -Uri $url -OutFile $local -UseBasicParsing

  $sizeMb = [math]::Round((Get-Item -LiteralPath $local).Length / 1MB, 1)
  Write-Host "Selesai diunduh ($sizeMb MB): $local" -ForegroundColor Green
  return $local
}

$healthUrl = "$Target/api/v1/health"
$deadline = (Get-Date).AddSeconds(30)
$ready = $false

while ((Get-Date) -lt $deadline) {
  try {
    Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5 | Out-Null
    $ready = $true
    break
  } catch {
    Start-Sleep -Seconds 2
  }
}

if (-not $ready) {
  Write-Host ""
  Write-Host "Web Bakul belum menjawab di $Target." -ForegroundColor Red
  Write-Host "Jalankan 'npm run dev' di terminal lain, tunggu sampai siap, lalu ulangi 'npm run share'." -ForegroundColor Yellow
  exit 1
}

$exe = Resolve-Cloudflared

Write-Host ""
Write-Host "Membuka tunnel Cloudflare ke $Target ..." -ForegroundColor Cyan
Write-Host "Tautan https://....trycloudflare.com muncul di bawah ini." -ForegroundColor Cyan
Write-Host "Tautan bersifat publik dan hanya hidup selama terminal ini terbuka." -ForegroundColor Yellow
Write-Host "Tekan Ctrl+C untuk menutup tunnel." -ForegroundColor Yellow
Write-Host ""

& $exe tunnel --no-autoupdate --url $Target
