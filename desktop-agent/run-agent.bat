@echo off
title WorkPulse Desktop Telemetry Agent
cd /d "%~dp0\.."
echo Starting WorkPulse Desktop Telemetry Agent...
node desktop-agent/agent.mjs %*
pause
