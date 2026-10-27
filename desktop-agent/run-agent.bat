@echo off
title GA WORK-TIME Desktop Agent
cd /d "%~dp0\.."
echo Starting GA WORK-TIME Desktop Agent...
node desktop-agent/agent.mjs %*
pause
