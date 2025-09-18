---
name: "HR Taskflow PRP Base"
description: "Base prompt for generating project requirement plans within the HR Taskflow repository"
---

## Purpose

Provide a consistent scaffold for crafting feature PRPs that extend the HR Taskflow blueprint defined in `master-prompt.md`. Every generated PRP must reinforce the Next.js (App Router) + Supabase stack, uphold division-aware workflows, and maintain the semi-dark HR admin experience.

## Core Principles

1. Blueprint Fidelity - Align with `master-prompt.md` deliverables (roles, screens, Supabase schema, RLS policies).
2. Modular Ownership - Separate frontend, backend, data, and QA responsibilities; lean on `AGENTS.md`, `generate-prp.md`, and `execute-prp.md` for shared practices.
3. Validation Driven - Define concrete commands for linting, testing, Supabase migrations/seeds, and coverage checks (>=80%).
4. Secret Safety - Document environment expectations without exposing credentials; use `.env.example`, `.env.local`, and `supabase/.env`.
5. Thai Division Accuracy - Preserve official division names and RBAC mappings across all deliverables.

## Goal

Produce an actionable PRP for **[FEATURE_OR_FOCUS]** that describes the workstream narrative, required files, validation gates, edge cases, and success criteria necessary to ship the feature within this repository.

## Context to Load

```yaml
- file: master-prompt.md
- file: AGENTS.md
- file: .claude/commands/generate-prp.md
- file: .claude/commands/execute-prp.md
- glob: prp-*.md  # review prior feature PRPs when they exist
```
Add additional references (design docs, API specs, Supabase schemas) when relevant to the feature.

## Structure for Generated PRPs

1. Overview - Summarize feature intent, impacted divisions, and user roles.
2. Scope & Deliverables - Enumerate pages, components, migrations, and configuration changes.
3. Implementation Plan - Break work into frontend/backend/data subsections with tasks, owner hints, and dependencies.
4. Validation Checklist - Provide runnable commands (npm, npx, supabase) and manual QA steps (UX states, RLS assertions, file upload tests).
5. Success Criteria - Tie back to master prompt requirements: UX polish, RBAC enforcement, real-time file counts, responsive design, localization readiness.
6. Risks & Mitigations - Note Supabase RLS pitfalls, caching issues, migration rollback steps, and monitoring/logging considerations.
7. Follow-up - Identify docs, analytics, or automation updates needed post-merge.

## Required Validation Commands

```bash
npm run lint
npm run test -- --coverage
npm run build
npx playwright test  # when E2E specs are defined
supabase start
supabase db push --dry-run
supabase db reset
rg "TODO|FIXME|WEBSEARCH_NEEDED" src supabase
```
Extend with feature-specific scripts (for example `supabase gen types typescript --local`, `npm run storybook`) when applicable.

## Success Criteria Checklist

- [ ] Feature narrative matches master prompt scope and Thai division taxonomy.
- [ ] Deliverables list covers routes, UI components, server logic, migrations, storage policies, and tests.
- [ ] Validation gate commands executable without modification.
- [ ] Security posture documented (auth guards, RLS, secret handling).
- [ ] UX expectations reiterated (semi-dark admin, responsive layouts, skeletons, toasts).
- [ ] Testing plan spans unit, integration, and, when relevant, Playwright flows.
- [ ] Dependencies and sequencing clarified for multi-agent execution.
- [ ] Post-merge tasks (docs, analytics, feature flags) captured.

## Anti-Patterns to Avoid

- Ignoring `master-prompt.md` constraints or altering division names.
- Omitting Supabase migration and seed requirements.
- Relying on stored file counters instead of querying `files`.
- Leaving validation commands generic or unverifiable.
- Forgetting to map RBAC behaviour for `superadmin`, `admin`, and `user` roles.
