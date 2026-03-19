@echo off
REM Elemental Hunter Playtest — Build Script
REM Usage: build.bat
REM Output: playtest/server/build/install/elemental-hunter-playtest/

echo [Playtest Build] Building server...
cd /d "%~dp0..\server"
call gradlew.bat assemble
if %ERRORLEVEL% neq 0 (
    echo [Playtest Build] FAILED
    exit /b 1
)
echo [Playtest Build] SUCCESS — dist at build\install\elemental-hunter-playtest\
