# ThreatForecast

AI-based network attack classification and next-stage decision support for **SIH26153**, National Technical Research Organisation (NTRO). Problem title supplied by the team: **AI based Network Attack Forecasting from Network Traffic Data**.

A runnable SIH research prototype: React analyst dashboard, FastAPI inference, a bundled Random Forest classifier, heuristic progression rules, CSV/JSON import, persistent analysis reports and portable deployment configuration.

**Be precise in the demo:** current-stage classification is ML; next-stage forecasting is currently heuristic. Monitoring is simulated. Scores are uncalibrated, and the system does not estimate time to attack. See the [model card](docs/MODEL_CARD.md) and [project review and SIH evaluation plan](docs/PROJECT_REVIEW.md).

## Quick start: Docker

Requires Docker with Compose on a compatible Windows, Linux or macOS machine. From this repository:

```sh
docker compose up --build -d
```

Open [Analysis Workspace](http://localhost:8000/workspace) or [API docs](http://localhost:8000/docs). First build requires internet. Bundled models are included; large datasets are unnecessary to run inference.

```sh
docker compose logs -f
docker compose down
```

Saved analyses persist in the named volume. Compose binds to localhost by default. Docker was not installed on the review machine; container execution is checked by the included GitHub workflow when it runs.

## Local setup

Use **Python 3.14** and **Node.js 24** with npm. The bundled classifier was checked with scikit-learn 1.9.0. Do not copy another computer's virtual environment or node_modules.

Windows, from the project root:

```powershell
py -3.14 -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
cd frontend
npm ci
npm run build
cd ..
.venv\Scripts\python.exe run.py
```

Linux/macOS:

```sh
python3.14 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
cd frontend
npm ci
npm run build
cd ..
.venv/bin/python run.py
```

Open [http://localhost:8000/workspace](http://localhost:8000/workspace). One server serves the built dashboard and API. For inference-only installation, use requirements.txt instead of requirements-dev.txt.

Subsequent starts: `powershell -File scripts/start.ps1` on Windows or `sh scripts/start.sh` on Linux/macOS. You can also run `python run.py` inside the activated environment.

For frontend development, run `python -m uvicorn backend.app:app --reload` from the root and `npm run dev` in frontend in another terminal. Vite proxies /api to port 8000.

## Demo

1. Open **Analysis Workspace** and confirm “Classifier ready”.
2. Analyse the built-in synthetic example. Its provenance and omitted features are visible.
3. Import [examples/telemetry.csv](examples/telemetry.csv), also synthetic, and select synthetic provenance before analysing.
4. Inspect current-stage classification, next-stage rule scores, evidence and suggested analyst actions.
5. Export the JSON report and revisit it in saved analyses after a restart.
6. Use Forecast for editable scenario presets and Monitoring for the explicitly labelled simulation.

Overview, Forecast Studio and Analysis Workspace use saved SQLite reports shared by this installation. New predictions are also cached in the browser threat log for compatibility; historical browser-only entries are not migrated.

## API

| Endpoint | Purpose |
|---|---|
| GET /api/health | Process/model status; degraded when model unavailable |
| GET /api/ready | 200 when classifier loaded; 503 otherwise |
| GET /api/system/status | Capabilities and method metadata |
| POST /api/predict | One telemetry record |
| POST /api/predict/batch | 1–100 independent records |
| POST /api/analyses | Analyse and persist a report |
| GET /api/analyses | Recent saved reports |
| GET /api/analyses/{id}/export | Download a saved JSON report |

Legacy unprefixed endpoints remain available. Full fields and examples: [data contract](docs/DATA_CONTRACT.md) and /docs. Empty/unknown/invalid telemetry is rejected. Omitted classifier features are explicitly reported and zero-filled; insufficient features can produce unreliable results.

## Configuration and deployment

No secrets are required for local inference. Set environment variables in your shell/container; .env.example documents them but is not automatically loaded.

| Variable | Default / purpose |
|---|---|
| HOST | 127.0.0.1; launcher bind address |
| PORT | 8000; launcher port |
| THREATFORECAST_MODEL_DIR | ml/models resolved relative to source |
| THREATFORECAST_DATABASE | data/runtime/analyses.db |
| VITE_API_BASE_URL | /api; optional frontend build-time override |

For a trusted LAN demo, set HOST to 0.0.0.0 with the local launcher and access the server computer's IP on port 8000. For Compose, change the port mapping deliberately. Firewall settings may also need adjustment. The same-origin frontend does not require machine-specific URLs.

This is a single-team deployment without authentication or account isolation. Before public hosting, add authentication, TLS, access control and operational resource limits. Reports may include security-sensitive inference details. Load joblib files only from trusted sources: deserialization can execute code.

The Docker image uses a non-root user, a readiness check and a persistent volume. Hardware must support the chosen Python/Node/Docker runtimes; “portable” does not mean it runs on every device without prerequisites.

## Validation

```sh
python -m pytest -q
cd frontend
npm run lint
npm run build
```

Tests exercise the real bundled classifier, API validation, probability normalization, benign persistence, risk ordering, model-path portability, unavailable/error handling, storage and temporal group boundaries. CI checks Windows, Linux, macOS and Docker after pushing. Local tests do not establish forecasting accuracy.

## ML and data

- Active classifier: ml/models/stage_classifier.joblib, 46 CICIoT23 features, five proxy stage classes.
- Active progression: ml/progression_model.py, hand-authored transition rules weighted by the full classifier distribution. Margin, entropy and feature coverage are exposed for analyst review.
- Experimental forecaster.joblib is retained but **not loaded** by the API.
- ml/sequence_builder.py generates synthetic sequences. Its training results are not real campaign validation.
- ml/real_sequence_builder.py now requires actual timestamped, campaign-grouped behavioural observations. See the data contract.
- Existing classifier training uses an exploratory random row split; campaign-held-out evaluation is still needed.
- CICIoT23 and CTU preprocessing scripts exist. Other datasets mentioned in earlier plans are not integrated evaluation evidence.

Raw/processed datasets and runtime reports are excluded from Git. Do not commit private captures or credentials. Training is optional and can overwrite the bundled artifacts; preserve copies before retraining. No retraining was performed in this review.

## Repository

```text
backend/          API, validation, model service, SQLite summaries
frontend/         React/Vite dashboard and analysis workspace
ml/               classifier, heuristic progression, experimental training
preprocessing/    CICIoT23 and CTU dataset preparation
examples/         small synthetic import example
tests/            API and temporal-data regression checks
docs/             review, data contract, team credits
scripts/          launch helpers
Dockerfile        frontend build + non-root API runtime
compose.yaml      local deployment and persistent volume
.github/workflows/ci.yml
```

The legacy Streamlit dashboard is not part of the supported deployment.

## Preparing for GitHub

The repository already has Git metadata. Review changes and the configured remote before publishing:

```sh
git status
git diff --check
git diff
git remote -v
```

Run the checks above, review any model/dataset files, then commit and push to your chosen repository. This update does not create a remote, commit or push changes. Model files are already tracked; datasets and runtime state remain ignored.

[Team credits](docs/TEAM.md) · [MIT License](LICENSE)
