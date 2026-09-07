$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\\.."
docker compose up -d
docker ps --filter "name=citysync-postgis"
