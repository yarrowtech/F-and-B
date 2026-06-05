$ErrorActionPreference = "Stop"

$taskName = "F-B-Main Local Print Agent"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$backendDir = Join-Path $repoRoot "Backend"
$nodePath = (Get-Command node.exe).Source
$scriptPath = Join-Path $backendDir "scripts\localDevicePrintAgent.js"

if (!(Test-Path $scriptPath)) {
  throw "Local print agent script not found: $scriptPath"
}

$action = New-ScheduledTaskAction `
  -Execute $nodePath `
  -Argument "`"$scriptPath`"" `
  -WorkingDirectory $repoRoot

$trigger = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel LeastPrivilege
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -MultipleInstances IgnoreNew `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Force | Out-Null

Start-ScheduledTask -TaskName $taskName

Write-Host "Installed and started: $taskName"
Write-Host "Local print agent URL: http://127.0.0.1:17877"
