# Validation record

Local review on Windows, 12 September 2026.

- Python: bundled environment, scikit-learn 1.9.0, real tracked stage classifier.
- `python -m pytest -q`: **28 passed**. Two upstream test-client deprecation warnings; no test failures.
- `npm ci`: successful clean install; npm audit reported **0 known vulnerabilities** at execution time.
- `npm run lint`: passed without findings.
- `npm run build`: passed with page-level lazy loading. Initial JS approximately 236 KB before compression (76 KB gzip); Forecast Studio is approximately 7 KB and Monitoring/chart code loads separately.
- Browser: classifier readiness, sample inference, CSV parsing, two-record analysis, weighted next-state ranking, evidence display and history reload verified.
- Responsive browser check: Forecast Studio rendered at 390 × 844 and completed a forecast successfully; the viewport override was reset afterward.
- Overview browser check: shared report metrics, latest forecast, service health and recent analyses rendered correctly.
- Export endpoint tested for attachment header, exact persisted report contents, and missing-record 404.
- Server-backed JSON report download confirmed through the browser download event.
- Server successfully restarted using `run.py`; persistent reports remained in the installation database.
- `git diff --check`: passed (Git printed line-ending normalization notices).

Docker is unavailable on the local machine. Docker image/Compose and Windows/Linux/macOS CI are provided but have not been executed by GitHub Actions in this review. These are not cross-platform test results. No training, real-world accuracy benchmarking, packet capture or public deployment was performed.
