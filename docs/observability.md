# Observability (lightweight)

Goals

- See problems early and debug quickly without heavy tooling.
- Start small; add depth only when needed.

Core signals

- Logs (mandatory)
  - Use Pino JSON logs with requestId and userId when present.
  - Levels: info for normal ops, warn for 4xx auth/permissions, error for 5xx.
  - Redact secrets and tokens.
- Health checks (mandatory)
  - `/api/v1/live`: process is up (no dependencies).
  - `/api/v1/ready`: checks DB and critical integrations with short timeouts.
- Metrics (optional, recommended)
  - Expose `/metrics` in non-prod or behind auth. Prometheus text format.
  - Counters: requests_total{route,status}, errors_total{code}.
  - Gauges: up, db_pool_in_use.
  - Summaries/Histograms: request_duration_seconds{route,method,status} (low-cardinality labels).
- Tracing (optional)
  - Use W3C Trace-Context headers (traceparent). Propagate if present.
  - Add minimal spans around external calls if using OpenTelemetry.

Implementation hints

- Fastify logger already injects requestId; use `req.id` in structured logs.
- Wrap DB/external calls with short timeouts and log duration on slow (>500ms).
- Add a global onError hook to log failures with code, status, requestId.

Redaction policy

- Redact: Authorization, Set-Cookie, password, token, refreshToken, email (optional mask), any secret env.

Dashboards (starter)

- Requests per minute, error rate (4xx vs 5xx), p95 latency.
- Top endpoints by latency and by errors.
- DB pool saturation and slow queries count (if available from driver/Prisma logs).

Alerting (when ready)

- Page on sustained 5xx rate or p95 > target for 5+ minutes.
- Ticket on readiness check failing.

Checklist

- [ ] Logs are structured and redacted.
- [ ] Live/ready endpoints implemented with timeouts.
- [ ] Optional /metrics behind auth or disabled in prod by default.
- [ ] Trace headers propagated if present.
- [ ] Basic dashboards configured.
