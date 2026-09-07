$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\\..\\backend"
if (-not (Test-Path ".venv\\Scripts\\python.exe")) {
    py -3.13 -m venv .venv
}
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Write-Host "Backend setup complete."
