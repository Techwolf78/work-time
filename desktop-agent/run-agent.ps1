<#
.SYNOPSIS
    WorkPulse Desktop Telemetry Agent Launcher
#>
$agentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path "$agentDir\.."
Write-Host "Starting WorkPulse Desktop Telemetry Agent..." -ForegroundColor Cyan
node desktop-agent/agent.mjs $args
