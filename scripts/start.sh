#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
test -f frontend/dist/index.html || { echo 'Build frontend first; see README.md'; exit 1; }
exec .venv/bin/python run.py
