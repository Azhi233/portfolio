$ErrorActionPreference = 'Stop'

$minioDir = 'C:\minio'
$minioExe = Join-Path $minioDir 'bin\minio.exe'
$minioDataDir = Join-Path $minioDir 'data'
$minioDownloadUrl = 'https://dl.min.io/server/minio/release/windows-amd64/minio.exe'
$settingsFile = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'portfolio-tools.settings.json'
$minioRootUser = 'moses233'
$minioRootPassword = 'moses233'
$minioConsolePort = 9001
$logDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$logOut = Join-Path $logDir 'minio.out.log'
$logErr = Join-Path $logDir 'minio.err.log'

if (Test-Path $settingsFile) {
  try {
    $settings = Get-Content $settingsFile -Raw | ConvertFrom-Json
    if ($settings.MinioRootUser) { $minioRootUser = [string]$settings.MinioRootUser }
    if ($settings.MinioRootPassword) { $minioRootPassword = [string]$settings.MinioRootPassword }
    if ($null -ne $settings.MinioConsolePort) { $minioConsolePort = [int]$settings.MinioConsolePort }
  } catch {
    Write-Host 'Failed to load settings file, using defaults.'
  }
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $minioExe) | Out-Null
New-Item -ItemType Directory -Force -Path $minioDataDir | Out-Null

if (-not (Test-Path $minioExe)) {
  Invoke-WebRequest -Uri $minioDownloadUrl -OutFile $minioExe
}

if (Test-Path $logOut) { Remove-Item $logOut -Force }
if (Test-Path $logErr) { Remove-Item $logErr -Force }

$env:MINIO_ROOT_USER = $minioRootUser
$env:MINIO_ROOT_PASSWORD = $minioRootPassword

Write-Host "Starting MinIO on http://127.0.0.1:9000 and console on http://127.0.0.1:$minioConsolePort"
Write-Host "Logs: $logOut / $logErr"

& $minioExe server $minioDataDir --console-address ":$minioConsolePort" *>> $logOut 2>> $logErr
