# PRP - HR Taskflow MVP

## Overview
- Build the first HR Taskflow release with Next.js App Router + Supabase, targeting superadmin/admin/user roles across the seven Thai divisions listed in master-prompt.md.
- Deliver a semi-dark admin workspace with responsive layouts, skeletons, toasts, and accessible navigation that respects division-based scoping.

## Scope & Deliverables
- App Router routes: /login, /reset-password, /dashboard, /committees, /committees/[id], /tasks, /tasks/[id], /admin/users, /admin/divisions, and a file management surface.
- Feature modules under src/features for tasks, committees, users, divisions; shared UI in src/components; utilities in src/lib; Supabase helpers in src/server/supabase.
- Supabase migrations for divisions, profiles, committees, tasks, task_assignments, files plus storage bucket workfiles; seeds load official division names (ฝ่ายบริหารทั่วไป, กลุ่มงานอัตรากำลังและกำหนดตำแหน่ง, กลุ่มงานสวัสดิการและเจ้าหน้าที่สัมพันธ์, กลุ่มงานสรรหา บรรจุและแต่งตั้ง, กลุ่มงานระบบข้อมูล ค่าตอบแทนและบำเหน็จความชอบ, กลุ่มงานวินัยและพิทักษ์ระบบคุณธรรม, งานฌาปนกิจสงเคราะห์ กระทรวงยุติธรรม) and sample RBAC users.
- Zod schemas + React Hook Form flows for CRUD forms, status timeline widget, file attachment panels, and advanced filtering (text, status, division, dates).
- Test coverage: colocated Jest/RTL suites, MSW-backed service tests, Playwright specs for login -> dashboard KPIs -> task CRUD -> file upload.
- Documentation: update .env.example, README Supabase steps, AGENTS.md references if new workflows emerge.

## Prioritized Milestones
1. **P0 - Access Foundations:** Supabase Auth flows, RLS/RBAC policies, division seeding, and route guards operational before any UI shipping.
2. **P0 - Core Work Surfaces:** Ship /login, /dashboard (status totals + overdue alerts), /tasks list + detail with assignment timeline, and /committees list to unlock daily operations.
3. **P1 - File Operations:** Enable workfiles bucket configuration, upload/download surfaces, and real-time file counts on tasks/committees.
4. **P1 - Admin Utilities:** Deliver /admin/users and /admin/divisions with role management, activation toggles, and division filtering.
5. **P2 - Experience Polish:** Advanced filters (date range, text search), Playwright coverage expansion, analytics hooks, and documentation uplift for onboarding.

## Implementation Plan
### Frontend
1. Deliver P0 views first: auth pages, dashboard summary cards, and task/committee lists with division-aware server components.
2. Layer in P1 widgets: file attachment panels, status timelines, and modal flows using shadcn/ui with Tailwind semi-dark theming.
3. Finalize P2 polish: responsive refinements, skeleton loaders, toast system wiring, and analytics hooks for future telemetry.

### Backend & Supabase
1. Stand up Supabase client factories, RLS-enforced repositories, and division-safe service methods; smoke-test with supabase start.
2. Author SQL migrations + seeds covering divisions, profiles, committees, tasks, task_assignments, files; add indexes for status/date queries and configure workfiles bucket policies.
3. Backfill P1/P2 enhancements: storage auditing, supabase db diff checks, and rollback scripts for migration safety.

### Data & QA
1. Implement auth QA scripts validating role scopes (superadmin, admin, user) across seeded data.
2. Configure Jest/RTL with MSW, enforce >=0.8 branch coverage, and schedule Playwright specs aligned with P0/P1 milestones.
3. Document validation workflow for CI (lint/test/build/playwright, supabase dry-run/reset) and create division lead handoff notes.

## Validation Checklist
- npm install
- npm run lint
- npm run test -- --coverage
- npm run build
- npx playwright test
- supabase start
- supabase db push --dry-run
- supabase db reset
- rg "TODO|FIXME|WEBSEARCH_NEEDED" src supabase

## Success Criteria
- Division taxonomy matches master prompt everywhere (seeds, dropdowns, dashboard summaries, RBAC policies).
- Real-time file counts derived from files table; no cached counters; uploads respect workfiles bucket policies.
- Semi-dark responsive UI with skeletons, toasts, and graceful degradation for slow Supabase calls.
- Auth + RBAC paths validated (superadmin full access, admin scoped to division, user limited to owned/assigned records).
- Automated tests cover core flows with >=80% branch coverage; validation commands succeed locally and in CI.

## Risks & Mitigations
- RLS misconfigurations -> pair every policy with Supabase emulator tests and review using supabase db diff.
- Storage ACL gaps -> add Playwright/MSW scenarios exercising uploads/downloads under each role.
- Migration drift between environments -> enforce dry-run + seed reset gate in CI and document rollback steps.
- Performance regressions on task filters -> add indexes, debounce inputs, and paginate via Supabase range queries.

## Follow-up
- Prepare analytics backlog (audit logs, task SLA metrics) for post-MVP iterations.
- Document admin onboarding, password reset SOPs, and QA playbooks in /docs (to be created).
- Plan i18n enablement (Thai/English copy decks) and monitoring hooks (Sentry, Supabase logs).

**Confidence:** 8/10
