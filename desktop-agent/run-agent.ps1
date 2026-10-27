<#
.SYNOPSIS
    GA WORK-TIME Desktop Agent Launcher
#>
$agentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path "$agentDir\.."
Write-Host "Starting GA WORK-TIME Desktop Agent..." -ForegroundColor Cyan
node desktop-agent/agent.mjs $args
