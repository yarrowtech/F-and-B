param(
  [Parameter(Mandatory = $true)]
  [string]$ApiUrl,

  [Parameter(Mandatory = $true)]
  [string]$EmployeeId,

  [Parameter(Mandatory = $true)]
  [string]$Password,

  [string]$PrinterName = ""
)

$ErrorActionPreference = "Stop"

$taskName = "F-B-Main Chef KOT Agent"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$backendDir = Join-Path $repoRoot "Backend"
$nodePath = (Get-Command node.exe).Source
$scriptPath = Join-Path $backendDir "scripts\chefKotPrintAgent.js"

if (!(Test-Path $scriptPath)) {
  throw "Chef KOT agent script not found: $scriptPath"
}

$envCommand = @(
  "`$env:PRINT_AGENT_API_URL='$ApiUrl'",
  "`$env:CHEF_KOT_AGENT_EMPLOYEE_ID='$EmployeeId'",
  "`$env:CHEF_KOT_AGENT_PASSWORD='$Password'"
)

if ($PrinterName) {
  $envCommand += "`$env:CHEF_KOT_AGENT_PRINTER_NAME='$PrinterName'"
}

$envCommand += "& '$nodePath' '$scriptPath'"
$command = $envCommand -join "; "

$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -Command `"$command`"" `
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
