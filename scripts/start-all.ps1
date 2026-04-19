$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$settingsFile = Join-Path $PSScriptRoot 'portfolio-tools.settings.json'
$frontendPort = 5175
$backendPort = 8788
$minioPort = 9000
$minioConsolePort = 9001
$minioRootUser = $env:MINIO_ROOT_USER
if (-not $minioRootUser) { $minioRootUser = 'moses233' }
$minioRootPassword = $env:MINIO_ROOT_PASSWORD
if (-not $minioRootPassword) { $minioRootPassword = 'moses233' }

if (Test-Path $settingsFile) {
  try {
    $settings = Get-Content $settingsFile -Raw | ConvertFrom-Json
    if ($null -ne $settings.FrontendPort) { $frontendPort = [int]$settings.FrontendPort }
    if ($null -ne $settings.BackendPort) { $backendPort = [int]$settings.BackendPort }
    if ($null -ne $settings.MinioConsolePort) { $minioConsolePort = [int]$settings.MinioConsolePort }
    if ($settings.MinioRootUser) { $minioRootUser = [string]$settings.MinioRootUser }
    if ($settings.MinioRootPassword) { $minioRootPassword = [string]$settings.MinioRootPassword }
  } catch {
    Write-Host 'Failed to load settings file, using defaults.'
  }
}
$frontendUrl = "http://localhost:$frontendPort"
$frontendLogOut = Join-Path $PSScriptRoot 'frontend.out.log'
$frontendLogErr = Join-Path $PSScriptRoot 'frontend.err.log'
$backendLogOut = Join-Path $PSScriptRoot 'backend.out.log'
$backendLogErr = Join-Path $PSScriptRoot 'backend.err.log'
$minioLogOut = Join-Path $PSScriptRoot 'minio.out.log'
$minioLogErr = Join-Path $PSScriptRoot 'minio.err.log'
$minioDir = 'C:\minio'
$minioExe = Join-Path $minioDir 'bin\minio.exe'
$minioDataDir = Join-Path $minioDir 'data'
$minioDownloadUrl = 'https://dl.min.io/server/minio/release/windows-amd64/minio.exe'

function Stop-PortProcess($port) {
  $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -ne $conn) {
    try {
      if ($conn.OwningProcess -gt 0) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped process on port $port (PID $($conn.OwningProcess))"
      }
    } catch {
      Write-Host "Failed to stop process on port ${port}: $($_.Exception.Message)"
    }
  }
}

function Stop-PortRange([int[]]$ports) {
  foreach ($port in $ports) {
    Stop-PortProcess $port
  }
}

function Wait-ForPort($port, $label, $timeoutSeconds = 45) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $conn -and $conn.State -eq 'Listen') {
      Write-Host "$label is ready on port $port (PID $($conn.OwningProcess))"
      return $true
    }
    Start-Sleep -Seconds 1
  }
  Write-Host "$label did not become ready on port ${port} within ${timeoutSeconds} seconds"
  return $false
}

function Get-FirstListeningPort([int[]]$ports) {
  foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $conn -and $conn.State -eq 'Listen') {
      return [pscustomobject]@{ Port = $port; Pid = $conn.OwningProcess }
    }
  }
  return $null
}

function Ensure-MinioBinary {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $minioExe) | Out-Null
  New-Item -ItemType Directory -Force -Path $minioDataDir | Out-Null

  if (-not (Test-Path $minioExe)) {
    Write-Host 'Downloading MinIO...'
    Invoke-WebRequest -Uri $minioDownloadUrl -OutFile $minioExe
  }
}

Stop-PortRange @($frontendPort, $backendPort, $backendPort + 1, $backendPort + 2, $minioPort, $minioConsolePort)
Start-Sleep -Seconds 1

foreach ($path in @($frontendLogOut, $frontendLogErr, $backendLogOut, $backendLogErr, $minioLogOut, $minioLogErr)) {
  if (Test-Path $path) { Remove-Item $path -Force -ErrorAction SilentlyContinue }
}

Ensure-MinioBinary

$minio = Start-Process powershell -PassThru -WindowStyle Hidden -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-Command',
  "`$env:MINIO_ROOT_USER='$minioRootUser'; `$env:MINIO_ROOT_PASSWORD='$minioRootPassword'; & '$minioExe' server '$minioDataDir' --console-address ':$minioConsolePort' *>> '$minioLogOut' 2>> '$minioLogErr'"
)

$frontend = Start-Process powershell -PassThru -WindowStyle Hidden -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-Command',
  "Set-Location '$root'; npm run dev:frontend -- --port $frontendPort *>> '$frontendLogOut' 2>> '$frontendLogErr'"
)

$backend = Start-Process powershell -PassThru -WindowStyle Hidden -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-Command',
  "Set-Location '$root/server'; `$env:MINIO_ENABLED='true'; `$env:MINIO_ENDPOINT='127.0.0.1'; `$env:MINIO_PORT='$minioPort'; `$env:MINIO_USE_SSL='false'; `$env:MINIO_ACCESS_KEY='$minioRootUser'; `$env:MINIO_SECRET_KEY='$minioRootPassword'; `$env:MINIO_PUBLIC_BASE_URL='http://localhost:$minioPort'; `$env:PUBLIC_FILE_BASE_URL='http://localhost:$minioPort'; npm run start -- --port $backendPort *>> '$backendLogOut' 2>> '$backendLogErr'"
)

$minioReady = Wait-ForPort $minioPort 'MinIO' 60
$minioConsoleReady = Wait-ForPort $minioConsolePort 'MinIO Console' 60
$backendReady = Wait-ForPort $backendPort 'Backend' 60
if (-not $backendReady) {
  $backendProbe = Get-FirstListeningPort @($backendPort, $backendPort + 1, $backendPort + 2)
  if ($backendProbe) {
    $backendPort = $backendProbe.Port
    $backendReady = $true
    Write-Host "Backend actually ready on port $backendPort (PID $($backendProbe.Pid))"
  }
}
$frontendReady = Wait-ForPort $frontendPort 'Frontend' 60
if (-not $frontendReady) {
  $frontendProbe = Get-FirstListeningPort @($frontendPort, $frontendPort + 1, $frontendPort + 2)
  if ($frontendProbe) {
    $frontendPort = $frontendProbe.Port
    $frontendReady = $true
    Write-Host "Frontend actually ready on port $frontendPort (PID $($frontendProbe.Pid))"
  }
}

if ($frontendReady) {
  Start-Process "http://localhost:$frontendPort"
}

Write-Host ''
Write-Host "Started MinIO on port $minioPort (PID $($minio.Id))"
Write-Host "Started frontend on port $frontendPort (PID $($frontend.Id))"
Write-Host "Started backend on port $backendPort (PID $($backend.Id))"
Write-Host "Logs:"
Write-Host "  MinIO:     $minioLogOut"
Write-Host "  Frontend:  $frontendLogOut"
Write-Host "  Backend:   $backendLogOut"
if (-not $minioReady -or -not $backendReady -or -not $frontendReady) {
  Write-Host 'One or more services did not become ready. Check the log files above.'
} else {
  Write-Host 'All services are ready.'
}
