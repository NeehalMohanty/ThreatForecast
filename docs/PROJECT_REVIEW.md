# Project review and SIH readiness

Problem statement supplied by the team: **SIH26153**, NTRO, “AI based Network Attack Forecasting from Network Traffic Data.” The supplied screenshot contains the title, not detailed acceptance criteria; no additional official requirements are assumed.

## Improvements delivered

| Finding | Change |
|---|---|
| Frontend hard-coded to 127.0.0.1 | Same-origin API, development proxy, optional build-time API URL |
| No complete install or deployment contract | Pinned direct Python requirements, lockfile-based frontend install, single-server launcher, Docker Compose, CI |
| Model paths depended on working directory | Resolve relative to source, configurable trusted model directory |
| Next-stage selection forced benign traffic to progress | Return the highest-scoring state, including persistence |
| LOW severity used confidence as risk | Severity index consistently ordered at 20/50/75/90 |
| Magnitude silently discarded | Accept both magnitude and dataset spelling magnitue |
| Empty/invalid telemetry and unlimited batches | Explicit validation, finite numbers, non-negative measurements, signed trends, 100-record cap |
| Internal errors exposed to clients | Generic client errors and server-side logging |
| Random monitoring and invented hourly risk curve | Simulation notice and actual rule-score distribution |
| Only browser-local history | Separate analysis workspace with SQLite summaries and JSON export |
| “Real” temporal windows fabricated behaviour and sequence order | Require observed behavioural measurements, campaign IDs and timestamps |
| No automated checks | Regression tests, frontend lint/build, OS matrix and Docker smoke workflow |

## Evidence limits that remain

The shipped stage classifier exposes five classes: Benign, Execution, Initial Access, Lateral Movement, Reconnaissance. Its 46 CICIoT23 flow features are mapped to **proxy attack-stage labels**, not ground-truth campaign stages. Protocol flags cannot establish process creation, failed logins, privilege changes, or exfiltration on their own. Supply those indicators from correlated host/authentication telemetry.

The active forecasting engine uses hand-authored transition weights and behaviour multipliers. Version 2.1 propagates the complete classifier distribution through those rules so uncertainty in the current stage affects every candidate next stage. It also reports the top-two margin, normalized entropy, and supplied-feature coverage. These improve decision support and transparency; they do not turn heuristic scores into calibrated probabilities. The engine does **not** load forecaster.joblib. That artifact and the synthetic sequence trainer remain experimental. Their accuracy cannot demonstrate real-world forecasting. The previous README's Gradient Boosting description did not match the code, which uses Random Forest for both experimental trainers.

No accuracy, F1, lead time, or false-positive performance claim has been established by this review. Existing classifier training uses a stratified random row split and balances classes before splitting. That is exploratory and can overstate field performance. Do not present it as campaign-held-out validation.

The new observed-sequence builder prevents cross-sequence adjacency and retains same-stage transitions. It still needs genuine campaign telemetry, representative stage labels and operational sampling intervals. It does not make the deployed heuristic a trained temporal model.

Overview, Forecast Studio and Analysis Workspace use shared installation history. New forecast results are also copied to the browser threat log for compatibility with that legacy view. Monitoring remains a simulation. The old Streamlit dashboard is a legacy experiment and is not part of the supported deployment.

## SIH demonstration

1. Open `/workspace` and show classifier readiness and the method notice.
2. Load the synthetic sample, explain provenance, and analyse it.
3. Inspect classification, next-stage weights, evidence, missing features and suggested response.
4. Import a numeric CSV of your own flow features and compare results.
5. Export the report; restart the server and demonstrate saved analysis history.
6. Explain what a stage forecast adds to detection and why calibrated lead time requires further evaluation.

## Validation needed before stronger claims

- Acquire authorized, timestamped, campaign/host-grouped traffic and correlated host events.
- Audit dataset licences and attack-stage label mappings, including unsupported attack types.
- Split complete campaigns before balancing or selecting windows; preserve natural class prevalence in test data.
- Compare persistence, empirical transition counts and a trained temporal model on the same held-out campaigns.
- Report per-class precision/recall, macro-F1, confusion matrix, benign false-positive rate and class support.
- Evaluate calibration, Brier score, abstention/coverage and measured forecast lead time at declared horizons.
- Run a separate dataset/domain test and report hardware, throughput, latency and model/data versions.
- Add authenticated ingestion, role-based access, TLS, retention controls, audit logging and resource limits before shared/public operation.

These are remaining engineering and research tasks, not implemented capabilities or measured results.
