# Contributing

Use Python 3.14 and Node 24. Follow README.md for local setup and create a branch for changes.

Before proposing changes, run `python -m pytest -q`, then `npm ci`, `npm run lint` and `npm run build` in frontend. Include the behaviour change, relevant validation and any evidence limits in your pull request.

Keep datasets, private network logs, credentials and runtime reports out of Git. Small synthetic fixtures must be labelled as synthetic. Do not claim forecasting accuracy from synthetic scenarios or random-row evaluation. Any model change needs feature compatibility, provenance, held-out evaluation and an explicit model card.

Retain compatibility for existing reports: fields added to API outputs may be absent in historical records. Changes to the SQLite schema require a migration. Do not couple frontend URLs to one machine.
