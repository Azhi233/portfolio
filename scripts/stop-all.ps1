$ErrorActionPreference = 'SilentlyContinue'

$ports = @(5175, 8788, 9000, 9001)
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

foreach ($port in $ports) {
  $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -ne $conn) {
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped port $port (PID $($conn.OwningProcess))"
  }
}

$logFiles = @(
  'frontend.out.log',
  'frontend.err.log',
  'backend.out.log',
  'backend.err.log',
  'minio.out.log',
  'minio.err.log'
)

foreach ($file in $logFiles) {
  $path = Join-Path $scriptRoot $file
  if (Test-Path $path) {
    Remove-Item $path -Force -ErrorAction SilentlyContinue
  }
}

Write-Host 'Stop requested for frontend, backend, and MinIO.'
