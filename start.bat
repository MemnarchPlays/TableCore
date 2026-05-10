@echo off
setlocal enabledelayedexpansion

set DEV_MODE=false
for %%A in (%*) do (
  if "%%A"=="--dev" set DEV_MODE=true
)

:: Node >= 18 check
where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is not installed. Download it from https://nodejs.org ^(v18 or newer^).
  pause
  exit /b 1
)

for /f "tokens=1 delims=." %%V in ('node -e "process.stdout.write(process.versions.node)"') do set NODE_MAJOR=%%V
if %NODE_MAJOR% LSS 18 (
  for /f %%V in ('node -e "process.stdout.write(process.versions.node)"') do set NODE_VER=%%V
  echo ERROR: Node.js v18+ required ^(found v!NODE_VER!^).
  pause
  exit /b 1
)

for /f %%V in ('node -e "process.stdout.write(process.versions.node)"') do echo Node.js v%%V OK

:: Install dependencies
echo.
echo Installing dependencies...
call npm install --prefer-offline
if errorlevel 1 ( echo ERROR: npm install failed. & pause & exit /b 1 )

:: Detect local IP (first non-loopback IPv4)
set LOCAL_IP=
for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /R "IPv4.*192\. IPv4.*10\. IPv4.*172\."') do (
  if "!LOCAL_IP!"=="" (
    for /f "tokens=* delims= " %%A in ("%%I") do set LOCAL_IP=%%A
  )
)

if "%DEV_MODE%"=="true" (
  echo.
  echo Starting dev server...
  echo.
  echo   Local:   http://localhost:3000
  if not "!LOCAL_IP!"=="" echo   Network: http://!LOCAL_IP!:3000
  echo.
  call npm run dev
) else (
  echo.
  echo Building for production...
  call npm run build
  if errorlevel 1 ( echo ERROR: Build failed. & pause & exit /b 1 )

  echo.
  echo Starting production server...
  echo.
  echo   Local:   http://localhost:3000
  if not "!LOCAL_IP!"=="" echo   Network: http://!LOCAL_IP!:3000
  echo.
  call npm start
)
