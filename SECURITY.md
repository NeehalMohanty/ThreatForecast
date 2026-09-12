# Security policy

ThreatForecast is a single-team research prototype, not a public multi-tenant SOC service. No account authentication or permission isolation is implemented. Default launchers bind to localhost.

Load only trusted joblib artifacts; model deserialization can execute code. Do not expose the service publicly without authentication, TLS, access controls, ingress resource limits and operational monitoring. Keep credentials and real capture files out of issues and pull requests.

For a suspected vulnerability, contact the repository maintainer privately using the contact method on their GitHub profile. If private vulnerability reporting is enabled on the repository, use that channel. Do not post exploit details or private telemetry in a public issue.
