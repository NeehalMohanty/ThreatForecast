# ThreatForecast frontend

React/Vite analyst dashboard. See the root README for the complete setup.

- Development: npm ci, then npm run dev. Start the API on port 8000 first.
- Build: npm run build. The Python server serves dist and /api together.
- Checks: npm run lint.
- /workspace: imports, inference, persisted summaries and report export.
- /forecast: editable synthetic presets, classifier-weighted next-state scores and shared saved reports.
- /monitoring: explicitly simulated traffic.

VITE_API_BASE_URL is an optional build-time override. It defaults to /api.
