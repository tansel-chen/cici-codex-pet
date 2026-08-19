@echo off
setlocal

set "SOURCE_DIR=%~dp0pet"

if defined CODEX_HOME (
  set "CODEX_DATA_DIR=%CODEX_HOME%"
) else (
  set "CODEX_DATA_DIR=%USERPROFILE%\.codex"
)

set "TARGET_DIR=%CODEX_DATA_DIR%\pets\cici"

if not exist "%SOURCE_DIR%\pet.json" (
  echo Cici pet package is incomplete: pet.json was not found.
  pause
  exit /b 1
)

if not exist "%SOURCE_DIR%\spritesheet.webp" (
  echo Cici pet package is incomplete: spritesheet.webp was not found.
  pause
  exit /b 1
)

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

copy /Y "%SOURCE_DIR%\pet.json" "%TARGET_DIR%\pet.json" >nul
copy /Y "%SOURCE_DIR%\spritesheet.webp" "%TARGET_DIR%\spritesheet.webp" >nul

if errorlevel 1 (
  echo Installation failed. Please check the folder permissions and try again.
  pause
  exit /b 1
)

echo Cici was installed to:
echo %TARGET_DIR%
echo.
echo Fully quit and reopen Codex, then select Cici from custom pets.
pause
