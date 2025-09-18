# Generate Project PRP

## Feature File
- Target brief: $ARGUMENTS
- Base blueprint: `master-prompt.md`
- Support docs: `prp_base.md`, `AGENTS.md`, prior feature PRPs (if available)

## Preparation Checklist
1. Re-read `master-prompt.md` to confirm roles, required screens, Supabase schema, and RLS mandates.
2. Note the official division names listed there; reuse them verbatim in the PRP.
3. Review `prp_base.md`, `AGENTS.md`, and any existing feature PRPs to confirm architecture, UI expectations, and backend policies.

## Research Process (Model After `examples/generate-template-prp.md`)
1. **Requirements Sweep**
   - Extract feature goals, user journeys, and acceptance criteria from the feature brief.
   - Identify impacted routes, Supabase tables, storage buckets, and environment variables.
2. **Documentation Review**
   - Consult official resources: Next.js App Router docs, Supabase Auth/DB/Storage/RLS pages, Tailwind + shadcn/ui guides, Zod and React Hook Form references.
   - Capture patterns for semi-dark admin dashboards, division-aware filtering, and file attachments with live counts.
3. **Pattern Benchmarking**
   - Study comparable Next.js + Supabase projects for structure, testing, and deployment practices.
   - Log common pitfalls (RLS loopholes, caching issues, migration rollbacks) and recommended mitigations.

## Prompt Assembly Steps
1. Map findings into modular sections: overview, scope, implementation plan (frontend, backend, data), validation checklist, success criteria, risks, follow-up.
2. Embed concrete commands for linting, testing, Supabase migrations/seeds, and optional Playwright runs.
3. Reference environment files (`.env.example`, `.env.local`, `supabase/.env`) and secret handling expectations.
4. Specify validation of division-based RBAC, real-time file counts, responsive UI, and localization readiness.
5. Keep wording concise (200-400 words) with actionable bullet points.

## Validation Commands
```bash
# Structure sanity
ls -la prp-*

# Content hygiene
grep -r "TODO\|PLACEHOLDER\|WEBSEARCH_NEEDED" prp-*

# Supabase alignment (dry run)
supabase db push --dry-run
```
Add feature-specific checks such as `npm run lint`, `npm run test -- --coverage`, `supabase db reset`, or `npx playwright test` when relevant.

## Quality Bar
- PRP references master prompt constraints and division taxonomy.
- Tasks reflect layered architecture (App Router routes, services, Supabase migrations/seeds).
- Validation gates executable without edits; coverage target >=80% stated.
- Risks include RLS, caching, and file storage considerations.
- Confidence score recorded (1-10); iterate if below 8.
