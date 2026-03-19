@echo off
REM Elemental Hunter Playtest — Run Smoke Test (quick mode)
REM Usage: run-smoke.bat [full]
REM   quick (default): use existing distribution
REM   full:            rebuild then smoke test

set MODE=quick
if "%1"=="full" set MODE=full

echo [Playtest] Running smoke test (Mode=%MODE%)...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0smoke-test.ps1" -Mode %MODE%
