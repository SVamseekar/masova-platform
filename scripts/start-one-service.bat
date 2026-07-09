@echo off
REM Usage: start-one-service.bat <service-dir-name>
REM Loads D:\Projects\masova-platform\.env then runs spring-boot:run with dev profile
setlocal EnableDelayedExpansion
set ROOT=D:\Projects\masova-platform
set SVC=%~1
if "%SVC%"=="" (
  echo Usage: start-one-service.bat core-service
  exit /b 1
)

REM Load .env into process environment
for /f "usebackq tokens=1,* delims==" %%A in (`findstr /R /V "^#" "%ROOT%\.env" ^| findstr /R /V "^$"`) do (
  set "%%A=%%B"
)

set SPRING_PROFILES_ACTIVE=dev
set MAVEN_OPTS=-Xmx512m

if not exist "%ROOT%\logs" mkdir "%ROOT%\logs"

cd /d "%ROOT%\%SVC%"
echo Starting %SVC% with profile=dev > "%ROOT%\logs\%SVC%.boot.log"
call "C:\Program Files\apache-maven-3.9.11\bin\mvn.cmd" spring-boot:run -Dmaven.test.skip=true -Dspring-boot.run.profiles=dev >> "%ROOT%\logs\%SVC%.boot.log" 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> "%ROOT%\logs\%SVC%.boot.log"
