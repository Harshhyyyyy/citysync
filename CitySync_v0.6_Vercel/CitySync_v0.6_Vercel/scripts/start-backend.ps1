$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\\..\\backend"
if (-not (Test-Path ".venv\\Scripts\\python.exe")) {
    Write-Host "Backend virtual environment not found. Run scripts/setup-backend.ps1 first."
    exit 1
}
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
