param(
  [string]$RepoPath = (Split-Path -Parent $PSScriptRoot),
  [string]$Branch = 'main',
  [string]$FrontendBuild = 'npm run build',
  [string]$ServerBuild = 'npm run build --prefix server',
  [string[]]$RestartServices = @('portfolio', 'portfolio-web'),
  [string]$RestartExtra = ''
)

$ErrorActionPreference = 'Stop'

function Invoke-CommandLine {
  param(
    [string]$CommandLine,
    [string]$WorkingDirectory
  )

  $isWindows = $PSVersionTable.PSEdition -eq 'Desktop' -or $IsWindows
  if ($isWindows) {
    & cmd /c $CommandLine
    return $LASTEXITCODE
  }

  & sh -lc $CommandLine
  return $LASTEXITCODE
}

function Restart-Services {
  param([string[]]$ServiceNames)

  foreach ($service in $ServiceNames) {
    if (-not $service) { continue }
    try {
      & systemctl restart $service
      Write-Host "Restarted service $service"
    } catch {
      Write-Host "Failed to restart service $service: $($_.Exception.Message)"
    }
  }
}

Set-Location $RepoPath
Write-Host "Pulling latest from origin/$Branch"
& git pull --ff-only origin $Branch
if ($LASTEXITCODE -ne 0) { throw 'git pull failed' }

Write-Host "Building frontend"
if ((Invoke-CommandLine -CommandLine $FrontendBuild -WorkingDirectory $RepoPath) -ne 0) { throw 'frontend build failed' }

Write-Host "Building backend"
if ((Invoke-CommandLine -CommandLine $ServerBuild -WorkingDirectory (Join-Path $RepoPath 'server')) -ne 0) { throw 'backend build failed' }

Restart-Services -ServiceNames $RestartServices

if ($RestartExtra) {
  $RestartExtra.Split(';') | ForEach-Object {
    $cmd = $_.Trim()
    if ($cmd) {
      Write-Host "Running extra restart command: $cmd"
      [void](Invoke-CommandLine -CommandLine $cmd -WorkingDirectory $RepoPath)
    }
  }
}

Write-Host 'Deployment completed successfully.'
