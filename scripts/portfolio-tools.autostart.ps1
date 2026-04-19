$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $PSScriptRoot 'portfolio-tools.ps1')
# Auto-start services when this variant is launched.
Start-Services -OpenBrowser:$true
