# CI/CD quality gates

Goal

- Block risky changes early with fast, clear checks.

Pipeline (per push/PR)

1. Install deps (pnpm) and cache.
2. Lint: ESLint + Prettier (no warnings allowed).
3. Typecheck: `tsc --noEmit`.
4. Unit/Integration tests: Vitest with coverage.
   - Threshold: ≥ 80% per file (see development-principles.md).
5. OpenAPI: boot the app in a minimal mode and fetch `/docs/json`; validate with an OpenAPI linter.
6. Build (if producing an artifact) or start container build.

Required environment (CI)

- NODE_ENV=test
- Minimal `.env` for test (no real secrets). Prefer ephemeral DB (SQLite or test schema) for CI.

Artifacts

- Store coverage report and OpenAPI JSON as build artifacts for debugging.

Branch protection

- Require all checks to pass on main/default branch.
- Optionally require at least one code review.

Release (tag or main)

- Build multi-stage Docker image.
- Run smoke test against the container: health endpoints, one GET and one POST endpoint.

Checklist

- [ ] Lint/typecheck pass with zero warnings.
- [ ] Tests pass; coverage ≥ 80% per file.
- [ ] OpenAPI JSON validated; no inline schemas introduced.
- [ ] Build artifact/container created and smoke-tested.
