$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\\.."
if (-not (docker ps --format '{{.Names}}' | Select-String '^citysync-postgis$')) {
    Write-Host "citysync-postgis is not running. Start Docker/database first."
    exit 1
}
Get-Content .\database\seed.sql | docker exec -i citysync-postgis psql -U citysync -d citysync
Write-Host "Demo GIS data seeded."
