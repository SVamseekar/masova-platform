# start-masova-services.ps1 — Dell Windows helper
# Starts all 6 Spring Boot services with spring.profiles.active=dev
$ErrorActionPreference = "Continue"
$root = "D:\Projects\masova-platform"
$logs = Join-Path $root "logs"
New-Item -ItemType Directory -Force -Path $logs | Out-Null

# Load .env (simple KEY=VALUE)
$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $i = $line.IndexOf("=")
    if ($i -lt 1) { return }
    $k = $line.Substring(0, $i).Trim()
    $v = $line.Substring($i + 1).Trim()
    [Environment]::SetEnvironmentVariable($k, $v, "Process")
  }
}

$env:SPRING_PROFILES_ACTIVE = "dev"

$services = @(
  @{ Name = "core-service"; Dir = "core-service" },
  @{ Name = "commerce-service"; Dir = "commerce-service" },
  @{ Name = "payment-service"; Dir = "payment-service" },
  @{ Name = "logistics-service"; Dir = "logistics-service" },
  @{ Name = "intelligence-service"; Dir = "intelligence-service" },
  @{ Name = "api-gateway"; Dir = "api-gateway" }
)

$mvn = "C:\Program Files\apache-maven-3.9.11\bin\mvn.cmd"
if (-not (Test-Path $mvn)) {
  Write-Error "mvn.cmd not found at $mvn"
  exit 1
}

foreach ($s in $services) {
  $work = Join-Path $root $s.Dir
  $out = Join-Path $logs ($s.Name + ".out.log")
  $err = Join-Path $logs ($s.Name + ".err.log")
  Write-Host "Starting $($s.Name) (dev) ..."
  Start-Process -FilePath $mvn `
    -ArgumentList @("spring-boot:run", "-Dmaven.test.skip=true", "-Dspring-boot.run.profiles=dev") `
    -WorkingDirectory $work `
    -RedirectStandardOutput $out `
    -RedirectStandardError $err `
    -WindowStyle Hidden
  Start-Sleep -Seconds 2
}

Write-Host "All Start-Process issued. Logs under $logs"
Write-Host "java processes:"
Get-Process java -ErrorAction SilentlyContinue | Format-Table Id, CPU, StartTime -AutoSize
