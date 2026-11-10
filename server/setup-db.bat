@echo off
REM ============================================================
REM  CampusBite — one-time database setup
REM  Usage:  setup-db.bat <mysql-root-password>
REM  Example: setup-db.bat mypassword
REM ============================================================
SET MYSQL="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
SET SCHEMA=d:\campusbit\server\schema.sql
SET ENV=d:\campusbit\server\.env

IF "%~1"=="" (
  echo Usage: setup-db.bat ^<mysql-root-password^>
  exit /b 1
)

echo Running schema...
%MYSQL% -u root -p%~1 < %SCHEMA%
IF ERRORLEVEL 1 (
  echo ERROR: Failed to run schema. Check your password and try again.
  exit /b 1
)

echo Updating .env with DB password...
powershell -Command "(Get-Content '%ENV%') -replace 'DB_PASSWORD=', 'DB_PASSWORD=%~1' | Set-Content '%ENV%'"

echo.
echo Done! Database 'campusbite' created with all tables.
echo .env updated with your DB password.
