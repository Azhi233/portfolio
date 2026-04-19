Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot
$settingsFile = Join-Path $scriptRoot 'portfolio-tools.settings.json'
$frontendLog = Join-Path $scriptRoot 'frontend.out.log'
$frontendErrLog = Join-Path $scriptRoot 'frontend.err.log'
$backendLog = Join-Path $scriptRoot 'backend.out.log'
$backendErrLog = Join-Path $scriptRoot 'backend.err.log'
$minioLog = Join-Path $scriptRoot 'minio.out.log'
$minioErrLog = Join-Path $scriptRoot 'minio.err.log'
$minioDir = 'C:\minio'
$minioExe = Join-Path $minioDir 'bin\minio.exe'
$minioDataDir = Join-Path $minioDir 'data'
$minioDownloadUrl = 'https://dl.min.io/server/minio/release/windows-amd64/minio.exe'
$healthCheckScript = Join-Path $scriptRoot 'env-health-check.mjs'

function Load-Settings {
  $defaults = [ordered]@{
    Language = 'en'
    FrontendPort = 5175
    BackendPort = 8788
    AutoOpen = $true
    MinioConsolePort = 9001
    MinioRootUser = 'moses233'
    MinioRootPassword = 'moses233'
  }

  if (-not (Test-Path $settingsFile)) { return $defaults }

  try {
    $json = Get-Content $settingsFile -Raw | ConvertFrom-Json
    return [ordered]@{
      Language = if ($json.Language -in @('en', 'zh')) { $json.Language } else { 'en' }
      FrontendPort = [int]((if ($null -ne $json.FrontendPort) { $json.FrontendPort } else { 5175 }))
      BackendPort = [int]((if ($null -ne $json.BackendPort) { $json.BackendPort } else { 8788 }))
      AutoOpen = if ($null -ne $json.AutoOpen) { [bool]$json.AutoOpen } else { $true }
      MinioConsolePort = [int]((if ($null -ne $json.MinioConsolePort) { $json.MinioConsolePort } else { 9001 }))
      MinioRootUser = if ($json.MinioRootUser) { [string]$json.MinioRootUser } else { 'moses233' }
      MinioRootPassword = if ($json.MinioRootPassword) { [string]$json.MinioRootPassword } else { 'moses233' }
    }
  } catch {
    return $defaults
  }
}

function Save-Settings {
  $payload = [ordered]@{
    Language = $state.Language
    FrontendPort = $state.FrontendPort
    BackendPort = $state.BackendPort
    AutoOpen = $state.AutoOpen
    MinioConsolePort = $state.MinioConsolePort
    MinioRootUser = $state.MinioRootUser
    MinioRootPassword = $state.MinioRootPassword
  }
  $payload | ConvertTo-Json -Depth 4 | Set-Content -Path $settingsFile -Encoding utf8
}

$loaded = Load-Settings
$state = [ordered]@{
  FrontendPid = $null
  BackendPid = $null
  MinioPid = $null
  Language = $loaded.Language
  FrontendPort = [int]$loaded.FrontendPort
  BackendPort = [int]$loaded.BackendPort
  AutoOpen = [bool]$loaded.AutoOpen
  MinioConsolePort = [int]$loaded.MinioConsolePort
  MinioRootUser = $loaded.MinioRootUser
  MinioRootPassword = $loaded.MinioRootPassword
}

$strings = @{
  en = @{
    title = 'Portfolio Dev Tools'
    subtitle = 'Start/stop frontend and backend, check ports, and open logs.'
    frontend = 'Frontend'
    backend = 'Backend'
    minio = 'MinIO'
    port = 'Port'
    state = 'State'
    pid = 'PID'
    start = 'Start'
    stop = 'Stop'
    stopAll = 'Stop All'
    refresh = 'Refresh Status'
    openFrontend = 'Open Frontend'
    openLogs = 'Open Logs Folder'
    clearLogs = 'Clear Logs'
    language = 'Language'
    autoOpen = 'Auto open browser'
    apply = 'Apply Ports'
    frontendPort = 'Frontend port'
    backendPort = 'Backend port'
    ready = 'Services ready.'
    starting = 'Starting services...'
    stopped = 'Stop requested.'
    logsCleared = 'Logs cleared.'
    statusFree = 'Free'
    statusStarting = 'Starting'
    statusReady = 'Ready'
    startMinio = 'Start MinIO'
  }
  zh = @{
    title = 'Portfolio Dev Tools'
    subtitle = '启动/停止前后端，查看端口状态，打开日志。'
    frontend = '前端'
    backend = '后端'
    minio = 'MinIO'
    port = '端口'
    state = '状态'
    pid = 'PID'
    start = '启动'
    stop = '停止'
    stopAll = '停止全部'
    refresh = '刷新状态'
    openFrontend = '打开前端'
    openLogs = '打开日志目录'
    clearLogs = '清空日志'
    language = '语言'
    autoOpen = '启动后自动打开浏览器'
    apply = '应用端口'
    frontendPort = '前端端口'
    backendPort = '后端端口'
    ready = '服务已就绪。'
    starting = '正在启动服务...'
    stopped = '已请求停止。'
    logsCleared = '日志已清空。'
    statusFree = '空闲'
    statusStarting = '启动中'
    statusReady = '就绪'
    startMinio = '启动 MinIO'
  }
}

function T([string]$key) { return $strings[$state.Language][$key] }

function Get-PortInfo([int]$port) {
  $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -eq $conn) { return [pscustomobject]@{ Port = $port; State = T('statusFree'); Pid = $null } }
  return [pscustomobject]@{ Port = $port; State = $conn.State; Pid = $conn.OwningProcess }
}

function Get-AvailablePort([int]$preferredPort, [int]$maxAttempts = 50) {
  $port = [int]$preferredPort
  for ($i = 0; $i -lt $maxAttempts; $i++) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $conn) { return $port }
    $port++
  }
  throw "Unable to find a free port starting at $preferredPort after $maxAttempts attempts."
}

function Stop-PortProcess([int]$port) {
  $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -ne $conn) {
    try {
      Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
      return "Stopped process on port ${port} (PID $($conn.OwningProcess))"
    } catch {
      return "Failed to stop process on port ${port}: $($_.Exception.Message)"
    }
  }
  return "No process found on port ${port}"
}

function Wait-ForPort([int]$port, [string]$label, [int]$timeoutSeconds = 45) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $conn -and $conn.State -eq 'Listen') {
      return [pscustomobject]@{ Ready = $true; Message = "$label is ready on port $port (PID $($conn.OwningProcess))"; Pid = $conn.OwningProcess }
    }
    [System.Windows.Forms.Application]::DoEvents()
    Start-Sleep -Milliseconds 300
  }
  return [pscustomobject]@{ Ready = $false; Message = "$label did not become ready on port ${port} within ${timeoutSeconds} seconds"; Pid = $null }
}

function Append-Log([System.Windows.Forms.TextBox]$box, [string]$message) {
  $timestamp = (Get-Date).ToString('HH:mm:ss')
  $box.AppendText("[$timestamp] $message$([Environment]::NewLine)")
}

function Set-Status([System.Windows.Forms.Label]$label, [string]$text) { $label.Text = $text }

function Refresh-PortLabels {
  param(
    [System.Windows.Forms.Label]$frontendLabel,
    [System.Windows.Forms.Label]$backendLabel,
    [System.Windows.Forms.Label]$minioLabel
  )
  $frontendInfo = Get-PortInfo -port $state.FrontendPort
  $backendInfo = Get-PortInfo -port $state.BackendPort
  $minioInfo = Get-PortInfo -port 9000
  $frontendLabel.Text = "{0} {1}: {2} | {3}: {4} | {5}: {6}" -f (T('frontend')), (T('port')), $state.FrontendPort, (T('state')), $frontendInfo.State, (T('pid')), $frontendInfo.Pid
  $backendLabel.Text = "{0} {1}: {2} | {3}: {4} | {5}: {6}" -f (T('backend')), (T('port')), $state.BackendPort, (T('state')), $backendInfo.State, (T('pid')), $backendInfo.Pid
  if ($null -ne $minioLabel) {
    $minioLabel.Text = "{0} {1}: {2} | {3}: {4} | {5}: {6}" -f (T('minio')), (T('port')), $state.MinioConsolePort, (T('state')), $minioInfo.State, (T('pid')), $minioInfo.Pid
  }
}

$form = New-Object System.Windows.Forms.Form
$form.Text = T('title')
$form.StartPosition = 'CenterScreen'
$form.Size = New-Object System.Drawing.Size(920, 710)
$form.MinimumSize = New-Object System.Drawing.Size(920, 710)
$form.BackColor = [System.Drawing.Color]::FromArgb(20, 20, 24)
$form.ForeColor = [System.Drawing.Color]::Gainsboro
$form.Font = New-Object System.Drawing.Font('Segoe UI', 9)
$form.AutoScaleMode = 'Font'

$title = New-Object System.Windows.Forms.Label
$title.Text = T('title')
$title.AutoSize = $true
$title.Font = New-Object System.Drawing.Font('Segoe UI', 20, [System.Drawing.FontStyle]::Bold)
$title.Location = New-Object System.Drawing.Point(24, 16)
$title.ForeColor = [System.Drawing.Color]::White
$form.Controls.Add($title)

$subtitle = New-Object System.Windows.Forms.Label
$subtitle.Text = T('subtitle')
$subtitle.AutoSize = $true
$subtitle.Location = New-Object System.Drawing.Point(26, 56)
$subtitle.ForeColor = [System.Drawing.Color]::LightGray
$form.Controls.Add($subtitle)

$topPanel = New-Object System.Windows.Forms.Panel
$topPanel.Location = New-Object System.Drawing.Point(20, 92)
$topPanel.Size = New-Object System.Drawing.Size(880, 160)
$topPanel.BackColor = [System.Drawing.Color]::FromArgb(32, 32, 38)
$form.Controls.Add($topPanel)

$frontendStatus = New-Object System.Windows.Forms.Label
$frontendStatus.AutoSize = $true
$frontendStatus.Location = New-Object System.Drawing.Point(18, 18)
$frontendStatus.ForeColor = [System.Drawing.Color]::FromArgb(190, 240, 220)
$topPanel.Controls.Add($frontendStatus)

$backendStatus = New-Object System.Windows.Forms.Label
$backendStatus.AutoSize = $true
$backendStatus.Location = New-Object System.Drawing.Point(18, 44)
$backendStatus.ForeColor = [System.Drawing.Color]::FromArgb(190, 220, 255)
$topPanel.Controls.Add($backendStatus)

$minioStatus = New-Object System.Windows.Forms.Label
$minioStatus.AutoSize = $true
$minioStatus.Location = New-Object System.Drawing.Point(18, 70)
$minioStatus.ForeColor = [System.Drawing.Color]::FromArgb(255, 220, 180)
$topPanel.Controls.Add($minioStatus)

$overallStatus = New-Object System.Windows.Forms.Label
$overallStatus.AutoSize = $true
$overallStatus.Location = New-Object System.Drawing.Point(18, 96)
$overallStatus.ForeColor = [System.Drawing.Color]::White
$topPanel.Controls.Add($overallStatus)

$languageLabel = New-Object System.Windows.Forms.Label
$languageLabel.Text = T('language')
$languageLabel.AutoSize = $true
$languageLabel.Location = New-Object System.Drawing.Point(18, 108)
$languageLabel.ForeColor = [System.Drawing.Color]::Gainsboro
$topPanel.Controls.Add($languageLabel)

$languageCombo = New-Object System.Windows.Forms.ComboBox
$languageCombo.DropDownStyle = 'DropDownList'
$languageCombo.Items.AddRange(@('English', '涓枃'))
$languageCombo.SelectedIndex = if ($state.Language -eq 'zh') { 1 } else { 0 }
$languageCombo.Location = New-Object System.Drawing.Point(78, 104)
$languageCombo.Width = 120
$topPanel.Controls.Add($languageCombo)

$autoOpenCheck = New-Object System.Windows.Forms.CheckBox
$autoOpenCheck.Text = T('autoOpen')
$autoOpenCheck.Checked = [bool]$state.AutoOpen
$autoOpenCheck.AutoSize = $true
$autoOpenCheck.Location = New-Object System.Drawing.Point(220, 106)
$autoOpenCheck.ForeColor = [System.Drawing.Color]::Gainsboro
$topPanel.Controls.Add($autoOpenCheck)

$frontendPortLabel = New-Object System.Windows.Forms.Label
$frontendPortLabel.Text = T('frontendPort')
$frontendPortLabel.AutoSize = $true
$frontendPortLabel.Location = New-Object System.Drawing.Point(18, 134)
$frontendPortLabel.ForeColor = [System.Drawing.Color]::Gainsboro
$topPanel.Controls.Add($frontendPortLabel)

$frontendPortBox = New-Object System.Windows.Forms.NumericUpDown
$frontendPortBox.Minimum = 1
$frontendPortBox.Maximum = 65535
$frontendPortBox.Value = [decimal]$state.FrontendPort
$frontendPortBox.Location = New-Object System.Drawing.Point(110, 130)
$frontendPortBox.Width = 120
$topPanel.Controls.Add($frontendPortBox)

$backendPortLabel = New-Object System.Windows.Forms.Label
$backendPortLabel.Text = T('backendPort')
$backendPortLabel.AutoSize = $true
$backendPortLabel.Location = New-Object System.Drawing.Point(360, 134)
$backendPortLabel.ForeColor = [System.Drawing.Color]::Gainsboro
$topPanel.Controls.Add($backendPortLabel)

$backendPortBox = New-Object System.Windows.Forms.NumericUpDown
$backendPortBox.Minimum = 1
$backendPortBox.Maximum = 65535
$backendPortBox.Value = [decimal]$state.BackendPort
$backendPortBox.Location = New-Object System.Drawing.Point(430, 130)
$backendPortBox.Width = 120
$topPanel.Controls.Add($backendPortBox)

$applyBtn = New-Object System.Windows.Forms.Button
$applyBtn.Text = T('apply')
$applyBtn.Location = New-Object System.Drawing.Point(580, 126)
$applyBtn.Size = New-Object System.Drawing.Size(120, 30)
$applyBtn.FlatStyle = 'Flat'
$topPanel.Controls.Add($applyBtn)

$minioPortLabel = New-Object System.Windows.Forms.Label
$minioPortLabel.Text = 'MinIO console'
$minioPortLabel.AutoSize = $true
$minioPortLabel.Location = New-Object System.Drawing.Point(720, 134)
$minioPortLabel.ForeColor = [System.Drawing.Color]::Gainsboro
$topPanel.Controls.Add($minioPortLabel)

$minioPortBox = New-Object System.Windows.Forms.NumericUpDown
$minioPortBox.Minimum = 1
$minioPortBox.Maximum = 65535
$minioPortBox.Value = [decimal]$state.MinioConsolePort
$minioPortBox.Location = New-Object System.Drawing.Point(800, 130)
$minioPortBox.Width = 80
$topPanel.Controls.Add($minioPortBox)

$minioUserLabel = New-Object System.Windows.Forms.Label
$minioUserLabel.Text = 'MinIO user'
$minioUserLabel.AutoSize = $true
$minioUserLabel.Location = New-Object System.Drawing.Point(18, 164)
$minioUserLabel.ForeColor = [System.Drawing.Color]::Gainsboro
$topPanel.Controls.Add($minioUserLabel)

$minioUserBox = New-Object System.Windows.Forms.TextBox
$minioUserBox.Text = $state.MinioRootUser
$minioUserBox.Location = New-Object System.Drawing.Point(110, 160)
$minioUserBox.Width = 140
$topPanel.Controls.Add($minioUserBox)

$minioPassLabel = New-Object System.Windows.Forms.Label
$minioPassLabel.Text = 'MinIO password'
$minioPassLabel.AutoSize = $true
$minioPassLabel.Location = New-Object System.Drawing.Point(270, 164)
$minioPassLabel.ForeColor = [System.Drawing.Color]::Gainsboro
$topPanel.Controls.Add($minioPassLabel)

$minioPassBox = New-Object System.Windows.Forms.TextBox
$minioPassBox.Text = $state.MinioRootPassword
$minioPassBox.UseSystemPasswordChar = $true
$minioPassBox.Location = New-Object System.Drawing.Point(380, 160)
$minioPassBox.Width = 140
$topPanel.Controls.Add($minioPassBox)

$startBtn = New-Object System.Windows.Forms.Button
$startBtn.Text = T('start')
$startBtn.Location = New-Object System.Drawing.Point(20, 270)
$startBtn.Size = New-Object System.Drawing.Size(110, 36)
$startBtn.BackColor = [System.Drawing.Color]::FromArgb(45, 120, 255)
$startBtn.ForeColor = [System.Drawing.Color]::White
$startBtn.FlatStyle = 'Flat'
$form.Controls.Add($startBtn)

$stopBtn = New-Object System.Windows.Forms.Button
$stopBtn.Text = T('stop')
$stopBtn.Location = New-Object System.Drawing.Point(140, 270)
$stopBtn.Size = New-Object System.Drawing.Size(110, 36)
$stopBtn.BackColor = [System.Drawing.Color]::FromArgb(220, 80, 80)
$stopBtn.ForeColor = [System.Drawing.Color]::White
$stopBtn.FlatStyle = 'Flat'
$form.Controls.Add($stopBtn)

$stopAllBtn = New-Object System.Windows.Forms.Button
$stopAllBtn.Text = T('stopAll')
$stopAllBtn.Location = New-Object System.Drawing.Point(260, 270)
$stopAllBtn.Size = New-Object System.Drawing.Size(110, 36)
$stopAllBtn.BackColor = [System.Drawing.Color]::FromArgb(180, 60, 60)
$stopAllBtn.ForeColor = [System.Drawing.Color]::White
$stopAllBtn.FlatStyle = 'Flat'
$form.Controls.Add($stopAllBtn)

$startMinioBtn = New-Object System.Windows.Forms.Button
$startMinioBtn.Text = T('startMinio')
$startMinioBtn.Location = New-Object System.Drawing.Point(380, 270)
$startMinioBtn.Size = New-Object System.Drawing.Size(120, 36)
$startMinioBtn.BackColor = [System.Drawing.Color]::FromArgb(240, 160, 70)
$startMinioBtn.ForeColor = [System.Drawing.Color]::Black
$startMinioBtn.FlatStyle = 'Flat'
$form.Controls.Add($startMinioBtn)

$healthCheckBtn = New-Object System.Windows.Forms.Button
$healthCheckBtn.Text = 'Health Check'
$healthCheckBtn.Location = New-Object System.Drawing.Point(510, 270)
$healthCheckBtn.Size = New-Object System.Drawing.Size(120, 36)
$healthCheckBtn.BackColor = [System.Drawing.Color]::FromArgb(70, 170, 130)
$healthCheckBtn.ForeColor = [System.Drawing.Color]::White
$healthCheckBtn.FlatStyle = 'Flat'
$form.Controls.Add($healthCheckBtn)

$statusBtn = New-Object System.Windows.Forms.Button
$statusBtn.Text = T('refresh')
$statusBtn.Location = New-Object System.Drawing.Point(640, 270)
$statusBtn.Size = New-Object System.Drawing.Size(100, 36)
$statusBtn.FlatStyle = 'Flat'
$form.Controls.Add($statusBtn)

$openFrontendBtn = New-Object System.Windows.Forms.Button
$openFrontendBtn.Text = T('openFrontend')
$openFrontendBtn.Location = New-Object System.Drawing.Point(750, 270)
$openFrontendBtn.Size = New-Object System.Drawing.Size(150, 36)
$openFrontendBtn.FlatStyle = 'Flat'
$form.Controls.Add($openFrontendBtn)

$openLogsBtn = New-Object System.Windows.Forms.Button
$openLogsBtn.Text = T('openLogs')
$openLogsBtn.Location = New-Object System.Drawing.Point(20, 312)
$openLogsBtn.Size = New-Object System.Drawing.Size(150, 32)
$openLogsBtn.FlatStyle = 'Flat'
$form.Controls.Add($openLogsBtn)

$copyReportBtn = New-Object System.Windows.Forms.Button
$copyReportBtn.Text = 'Copy Report'
$copyReportBtn.Location = New-Object System.Drawing.Point(180, 312)
$copyReportBtn.Size = New-Object System.Drawing.Size(120, 32)
$copyReportBtn.FlatStyle = 'Flat'
$form.Controls.Add($copyReportBtn)

$clearLogBtn = New-Object System.Windows.Forms.Button
$clearLogBtn.Text = T('clearLogs')
$clearLogBtn.Location = New-Object System.Drawing.Point(310, 312)
$clearLogBtn.Size = New-Object System.Drawing.Size(120, 32)
$clearLogBtn.FlatStyle = 'Flat'
$form.Controls.Add($clearLogBtn)

$healthSummaryLabel = New-Object System.Windows.Forms.Label
$healthSummaryLabel.AutoSize = $true
$healthSummaryLabel.Location = New-Object System.Drawing.Point(20, 346)
$healthSummaryLabel.ForeColor = [System.Drawing.Color]::Gainsboro
$healthSummaryLabel.Text = 'Health Check: idle'
$form.Controls.Add($healthSummaryLabel)

$resultsLabel = New-Object System.Windows.Forms.Label
$resultsLabel.AutoSize = $true
$resultsLabel.Location = New-Object System.Drawing.Point(20, 368)
$resultsLabel.ForeColor = [System.Drawing.Color]::Gainsboro
$resultsLabel.Text = '检测结果'
$form.Controls.Add($resultsLabel)

$resultsBox = New-Object System.Windows.Forms.TextBox
$resultsBox.Location = New-Object System.Drawing.Point(20, 390)
$resultsBox.Size = New-Object System.Drawing.Size(880, 120)
$resultsBox.Multiline = $true
$resultsBox.ScrollBars = 'Vertical'
$resultsBox.ReadOnly = $true
$resultsBox.BackColor = [System.Drawing.Color]::FromArgb(24, 24, 30)
$resultsBox.ForeColor = [System.Drawing.Color]::Gainsboro
$resultsBox.Font = New-Object System.Drawing.Font('Consolas', 9)
$form.Controls.Add($resultsBox)

$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Location = New-Object System.Drawing.Point(20, 520)
$logBox.Size = New-Object System.Drawing.Size(880, 124)
$logBox.Multiline = $true
$logBox.ScrollBars = 'Vertical'
$logBox.ReadOnly = $true
$logBox.BackColor = [System.Drawing.Color]::FromArgb(14, 14, 18)
$logBox.ForeColor = [System.Drawing.Color]::Gainsboro
$logBox.Font = New-Object System.Drawing.Font('Consolas', 9)
$form.Controls.Add($logBox)

function Update-UIText {
  $form.Text = T('title')
  $title.Text = T('title')
  $subtitle.Text = T('subtitle')
  $languageLabel.Text = T('language')
  $autoOpenCheck.Text = T('autoOpen')
  $frontendPortLabel.Text = T('frontendPort')
  $backendPortLabel.Text = T('backendPort')
  $minioPortLabel.Text = 'MinIO console'
  $minioUserLabel.Text = 'MinIO user'
  $minioPassLabel.Text = 'MinIO password'
  $applyBtn.Text = T('apply')
  $startBtn.Text = T('start')
  $stopBtn.Text = T('stop')
  $stopAllBtn.Text = T('stopAll')
  $startMinioBtn.Text = T('startMinio')
  $healthCheckBtn.Text = 'Health Check'
  $statusBtn.Text = T('refresh')
  $openFrontendBtn.Text = T('openFrontend')
  $openLogsBtn.Text = T('openLogs')
  $copyReportBtn.Text = 'Copy Report'
  $clearLogBtn.Text = T('clearLogs')
  Refresh-PortLabels -frontendLabel $frontendStatus -backendLabel $backendStatus -minioLabel $minioStatus
}

function Ensure-MinioBinary {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $minioExe) | Out-Null
  New-Item -ItemType Directory -Force -Path $minioDataDir | Out-Null
  if (-not (Test-Path $minioExe)) {
    Invoke-WebRequest -Uri $minioDownloadUrl -OutFile $minioExe
  }

  try {
    $bytes = Get-Content -Path $minioExe -Encoding Byte -TotalCount 2
    if ($bytes.Count -lt 2 -or $bytes[0] -ne 0x4D -or $bytes[1] -ne 0x5A) {
      Remove-Item $minioExe -Force -ErrorAction SilentlyContinue
      Invoke-WebRequest -Uri $minioDownloadUrl -OutFile $minioExe
    }
  } catch {
    Remove-Item $minioExe -Force -ErrorAction SilentlyContinue
    Invoke-WebRequest -Uri $minioDownloadUrl -OutFile $minioExe
  }
}

function Start-MinIO {
  Append-Log $logBox (Stop-PortProcess 9000)
  Append-Log $logBox (Stop-PortProcess $state.MinioConsolePort)
  Ensure-MinioBinary
  foreach ($path in @($minioLog, $minioErrLog)) {
    if (Test-Path $path) { Remove-Item $path -Force -ErrorAction SilentlyContinue }
  }

  $env:MINIO_ROOT_USER = $state.MinioRootUser
  $env:MINIO_ROOT_PASSWORD = $state.MinioRootPassword

  $minioProc = Start-Process -FilePath $minioExe -ArgumentList @(
    'server',
    $minioDataDir,
    '--console-address', ":$($state.MinioConsolePort)"
  ) -WorkingDirectory $minioDir -RedirectStandardOutput $minioLog -RedirectStandardError $minioErrLog -PassThru
  $state.MinioPid = $minioProc.Id
  $minioReady = Wait-ForPort -port 9000 -label (T('minio')) -timeoutSeconds 60
  if (-not $minioReady.Ready -and (Test-Path $minioErrLog)) {
    Append-Log $logBox (Get-Content $minioErrLog -Raw)
  }
  Append-Log $logBox $minioReady.Message
  Refresh-PortLabels -frontendLabel $frontendStatus -backendLabel $backendStatus -minioLabel $minioStatus
  return $minioReady.Ready
}

function Start-Services {
  param([switch]$OpenBrowser = $true)

  $requestedFrontendPort = [int]$frontendPortBox.Value
  $requestedBackendPort = [int]$backendPortBox.Value
  $state.MinioConsolePort = [int]$minioPortBox.Value
  $state.FrontendPort = Get-AvailablePort -preferredPort $requestedFrontendPort
  $state.BackendPort = Get-AvailablePort -preferredPort $requestedBackendPort
  $frontendPortBox.Value = [decimal]$state.FrontendPort
  $backendPortBox.Value = [decimal]$state.BackendPort
  $frontendUrl = "http://localhost:$($state.FrontendPort)"

  Append-Log $logBox (T('starting'))
  Start-MinIO | Out-Null
  Start-Sleep -Seconds 1

  foreach ($path in @($frontendLog, $frontendErrLog, $backendLog, $backendErrLog)) {
    if (Test-Path $path) { Remove-Item $path -Force -ErrorAction SilentlyContinue }
  }

  $frontendCmd = "Set-Location '$projectRoot'; npm run dev:frontend -- --port $($state.FrontendPort) *> '$frontendLog' 2> '$frontendErrLog'"
  $backendCmd = "Set-Location '$projectRoot/server'; npm run start -- --port $($state.BackendPort) *> '$backendLog' 2> '$backendErrLog'"

  $frontendProc = Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCmd -PassThru
  $backendProc = Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd -PassThru
  $state.FrontendPid = $frontendProc.Id
  $state.BackendPid = $backendProc.Id

  $frontendReady = Wait-ForPort -port $state.FrontendPort -label (T('frontend'))
  $backendReady = Wait-ForPort -port $state.BackendPort -label (T('backend'))

  Append-Log $logBox ("Requested ports were frontend=$requestedFrontendPort, backend=$requestedBackendPort; using frontend=$($state.FrontendPort), backend=$($state.BackendPort)")
  Append-Log $logBox $frontendReady.Message
  Append-Log $logBox $backendReady.Message

  if ($OpenBrowser -and $autoOpenCheck.Checked -and $frontendReady.Ready) {
    Start-Process $frontendUrl
  }

  Refresh-PortLabels -frontendLabel $frontendStatus -backendLabel $backendStatus -minioLabel $minioStatus
  if ($frontendReady.Ready -and $backendReady.Ready) {
    Set-Status $overallStatus (T('ready'))
  } else {
    Set-Status $overallStatus (T('statusStarting'))
  }
}

function Stop-Services {
  Append-Log $logBox (Stop-PortProcess $frontendPortBox.Value)
  Append-Log $logBox (Stop-PortProcess $backendPortBox.Value)
  Append-Log $logBox (Stop-PortProcess 9000)
  Append-Log $logBox (Stop-PortProcess $state.MinioConsolePort)
  Refresh-PortLabels -frontendLabel $frontendStatus -backendLabel $backendStatus -minioLabel $minioStatus
  Set-Status $overallStatus (T('stopped'))
}

function Start-AllServices {
  Start-Services -OpenBrowser:$true
}

function Refresh-View {
  Refresh-PortLabels -frontendLabel $frontendStatus -backendLabel $backendStatus -minioLabel $minioStatus
  $fi = Get-PortInfo -port ([int]$frontendPortBox.Value)
  $bi = Get-PortInfo -port ([int]$backendPortBox.Value)
  $mi = Get-PortInfo -port 9000
  Set-Status $overallStatus ("Frontend: $($fi.State) | Backend: $($bi.State) | MinIO: $($mi.State)")
}

$script:healthCheckTimer = $null
$script:healthCheckPid = $null
$script:healthCheckOutPath = $null
$script:healthCheckErrPath = $null

function Run-HealthCheck {
  if (-not (Test-Path $healthCheckScript)) {
    $healthSummaryLabel.Text = 'Health Check: script not found'
    Append-Log $logBox 'Health check script not found.'
    return
  }

  $healthSummaryLabel.Text = 'Health Check: running...'
  Append-Log $logBox 'Running health check...'

  $script:healthCheckOutPath = Join-Path $scriptRoot 'healthcheck.stdout.log'
  $script:healthCheckErrPath = Join-Path $scriptRoot 'healthcheck.stderr.log'
  foreach ($path in @($script:healthCheckOutPath, $script:healthCheckErrPath)) {
    if (Test-Path $path) { Remove-Item $path -Force -ErrorAction SilentlyContinue }
  }

  $runner = Start-Process node -ArgumentList @($healthCheckScript, '--json') -RedirectStandardOutput $script:healthCheckOutPath -RedirectStandardError $script:healthCheckErrPath -PassThru -WindowStyle Hidden
  if ($null -eq $runner -or $null -eq $runner.Id) {
    $healthSummaryLabel.Text = 'Health Check: failed to start'
    Append-Log $logBox 'Health check failed to start.'
    return
  }

  $script:healthCheckPid = $runner.Id
  $healthSummaryLabel.Text = "Health Check: running (PID $($script:healthCheckPid))"
  $logBox.AppendText("Health check PID: $($script:healthCheckPid)$([Environment]::NewLine)")

  if ($script:healthCheckTimer) {
    $script:healthCheckTimer.Stop()
    $script:healthCheckTimer.Dispose()
  }

  $script:healthCheckTimer = New-Object System.Windows.Forms.Timer
  $script:healthCheckTimer.Interval = 500
  $script:healthCheckTimer.Add_Tick({
    if ($null -eq $script:healthCheckPid) { return }
    $proc = Get-Process -Id $script:healthCheckPid -ErrorAction SilentlyContinue
    if ($null -ne $proc) { return }

    $script:healthCheckTimer.Stop()
    $output = if (Test-Path $script:healthCheckOutPath) { Get-Content $script:healthCheckOutPath -Raw } else { '' }
    $errorText = if (Test-Path $script:healthCheckErrPath) { Get-Content $script:healthCheckErrPath -Raw } else { '' }
    try {
      $json = $output | ConvertFrom-Json
      $summary = "Health Check: $($json.passed)/$($json.total) passed, report: $($json.reportPaths.mdPath)"
      $healthSummaryLabel.Text = $summary
      $resultsBox.Clear()
      $resultsBox.AppendText('--- STEP RESULTS ---' + [Environment]::NewLine)
      foreach ($item in $json.results) {
        $mark = if ($item.pass) { 'PASS' } else { 'FAIL' }
        $resultsBox.AppendText(("[$mark] {0}{1}" -f $item.name, ($(if ($item.detail) { " ($($item.detail))" } else { '' }))) + [Environment]::NewLine)
      }
      $resultsBox.AppendText('--- REPORT PATHS ---' + [Environment]::NewLine)
      $resultsBox.AppendText(("MD: $($json.reportPaths.mdPath)") + [Environment]::NewLine)
      $resultsBox.AppendText(("JSON: $($json.reportPaths.jsonPath)") + [Environment]::NewLine)
      if ($copyReportBtn) { $copyReportBtn.Enabled = $true }
    } catch {
      $healthSummaryLabel.Text = 'Health Check: completed (summary unavailable)'
    }
    if ($errorText) { Append-Log $logBox $errorText }
    if ($output) { Append-Log $logBox $output }
    $script:healthCheckPid = $null
  })
  $script:healthCheckTimer.Start()
}

$languageCombo.Add_SelectedIndexChanged({
  $state.Language = if ($languageCombo.SelectedIndex -eq 1) { 'zh' } else { 'en' }
  Save-Settings
  Update-UIText
  Refresh-View
})

$applyBtn.Add_Click({
  $state.FrontendPort = [int]$frontendPortBox.Value
  $state.BackendPort = [int]$backendPortBox.Value
  $state.AutoOpen = [bool]$autoOpenCheck.Checked
  $state.MinioConsolePort = [int]$minioPortBox.Value
  $state.MinioRootUser = [string]$minioUserBox.Text
  $state.MinioRootPassword = [string]$minioPassBox.Text
  Save-Settings
  Append-Log $logBox ("Ports set to frontend=$($state.FrontendPort), backend=$($state.BackendPort), minioConsole=$($state.MinioConsolePort)")
  Refresh-View
})

$startBtn.Add_Click({ Start-Services -OpenBrowser:$true })
$startMinioBtn.Add_Click({ Start-MinIO | Out-Null })
$healthCheckBtn.Add_Click({ Run-HealthCheck })
$stopBtn.Add_Click({ Stop-Services })
$stopAllBtn.Add_Click({ Stop-Services })
$statusBtn.Add_Click({ Refresh-View })
$openFrontendBtn.Add_Click({ Start-Process "http://localhost:$($frontendPortBox.Value)" })
$openLogsBtn.Add_Click({ Start-Process $scriptRoot })
$copyReportBtn.Add_Click({
  if (Test-Path (Join-Path $scriptRoot 'healthcheck-reports')) {
    $latest = Get-ChildItem (Join-Path $scriptRoot 'healthcheck-reports') -Filter '*.md' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latest) {
      Set-Clipboard -Value $latest.FullName
      Append-Log $logBox ("Copied report path: $($latest.FullName)")
    }
  }
})
$clearLogBtn.Add_Click({
  foreach ($path in @($frontendLog, $frontendErrLog, $backendLog, $backendErrLog, $minioLog, $minioErrLog)) {
    if (Test-Path $path) { Remove-Item $path -Force -ErrorAction SilentlyContinue }
  }
  $logBox.Clear()
  Append-Log $logBox (T('logsCleared'))
})

try {
  if ($state.Language -eq 'zh') { $languageCombo.SelectedIndex = 1 } else { $languageCombo.SelectedIndex = 0 }
  $frontendPortBox.Value = [decimal]$state.FrontendPort
  $backendPortBox.Value = [decimal]$state.BackendPort
  $minioPortBox.Value = [decimal]$state.MinioConsolePort
  $minioUserBox.Text = $state.MinioRootUser
  $minioPassBox.Text = $state.MinioRootPassword
  $autoOpenCheck.Checked = [bool]$state.AutoOpen
  Update-UIText
  Refresh-View
  Append-Log $logBox 'Ready.'
  $healthSummaryLabel.Text = 'Health Check: idle'
  $resultsBox.Clear()
  $copyReportBtn.Enabled = $false
  [void]$form.ShowDialog()
} catch {
  [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Portfolio Dev Tools', 'OK', 'Error') | Out-Null
  throw
}
