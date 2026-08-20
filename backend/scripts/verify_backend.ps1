$ErrorActionPreference = "Stop"

# Set backend working directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Split-Path -Parent $scriptDir
Set-Location $backendDir

# Configure Environment Flags
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONPATH = "."
$env:TESTING = "true"

# Use virtual environment python executable
$venvPython = Join-Path $backendDir "venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "Error: Virtual environment python not found at $venvPython" -ForegroundColor Red
    exit 1
}

# Execute unified test runner
& $venvPython scripts\run_all_tests.py
