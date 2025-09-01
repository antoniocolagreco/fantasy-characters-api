# Database migrations and rollback

Tooling

- Prisma Migrate for schema changes.

Principles

- Forward-only in production: avoid down migrations that drop data.
- Small, incremental migrations; one concern per migration file.
- Backward-compatible changes first, then code switch, then cleanup.

Workflow (safe pattern)

1. Additive phase (backward compatible)

- Add new columns/tables with defaults and nullability that keep old code working.
- Backfill data via migration or a one-off script.

1. Application switch

- Deploy code that writes to both old and new fields or reads from the new shape.
- Monitor for issues.

1. Cleanup phase

- Remove old columns/constraints in a later migration once traffic is on the new code.

Rollback strategy

- If a migration fails to apply: stop deploy; investigate; fix and re-run.
- If code deployment has issues after a schema change: roll back app code first. Keep additive schema in place; it should be backward compatible.
- For destructive changes (drops), use feature flags and ensure a prior deploy has removed dependencies before applying the drop.

Local/dev

- Use `prisma migrate dev` frequently; commit generated migrations.
- Avoid editing generated migration SQL after commit. Create a follow-up migration instead.

Checklist

- [ ] Migration is additive or has a clear compatibility plan.
- [ ] Data backfill plan exists if needed.
- [ ] App change and schema change are ordered safely across deploys.
- [ ] Destructive changes guarded by feature flags and delayed cleanup.
