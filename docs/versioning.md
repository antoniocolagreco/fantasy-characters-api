# API versioning policy

Goals

- Keep breaking changes isolated. Do not break existing clients without a new version.
- Keep maintenance simple: one active version at a time in development; limited overlap in production.

Version scheme

- Prefix all routes with a stable major: `/api/v1/...`.
- Only bump the major when a breaking change is introduced.
- Non-breaking additions (new fields, new endpoints) do not require a bump.

What is breaking

- Removing a field or endpoint.
- Changing field types or semantics.
- Tightening validation (e.g., shorter maxLength) for existing inputs.
- Changing default sort/order or pagination behavior in a way that changes responses for the same request.

Non-breaking examples

- Adding optional fields to responses.
- Adding new endpoints or query parameters that are optional.
- Increasing limits (e.g., maxLength from 80 → 120) while keeping old values valid.

Process

- New version starts at `/api/v2` with duplicated routes where changes are needed.
- Keep `/api/v1` read-only when possible; critical fixes only.
- Deprecate old endpoints with a `Deprecation` response header and documentation notes.
- Maintain both versions during a sunset period, then remove `/api/v1` after communicated date.

OpenAPI

- Each deployed major has its own OpenAPI server URL (e.g., `/api/v1`, `/api/v2`).
- Schemas are shared where compatible; otherwise duplicate with new `$id`s.

Deprecation headers

- Add header on deprecated endpoints: `Deprecation: true` and optional `Sunset: <HTTP-date>`.
- Optionally add `Link: <https://docs.example.com/migrate-to-v2>; rel="deprecation"`.

Minimal runtime behavior

- Do not spam logs. Log a single startup warning listing deprecated routes.
- Keep performance identical; deprecation shouldn’t slow requests.
- Keep error shapes and success payloads stable until removal.

Communication (lightweight)

- Add a short note in `docs/roadmap.md` with the sunset date and migration gist.
- If you control a client app, surface a developer console warning when calling deprecated endpoints (optional).

Checklist

- [ ] Changes classified as breaking/non-breaking.
- [ ] If breaking: duplicate route under `/api/v2` and update docs.
- [ ] Add Deprecation/Sunset headers to old endpoints.
- [ ] Communicate timeline in `docs/roadmap.md` and release notes.
