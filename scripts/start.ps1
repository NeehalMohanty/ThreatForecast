$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
if (-not (Test-Path '.venv/Scripts/python.exe')) { throw 'Create .venv and install requirements.txt first. See README.md.' }
if (-not (Test-Path 'frontend/dist/index.html')) { throw 'Run npm ci and npm run build in frontend first.' }
& ./.venv/Scripts/python.exe run.py
