# PRP - Committees & Command Papers Workstream

## Overview
- Deliver end-to-end command paper management for ฝ่ายบริหารทั่วไป, กลุ่มงานอัตรากำลังและกำหนดตำแหน่ง, กลุ่มงานสวัสดิการและเจ้าหน้าที่สัมพันธ์, กลุ่มงานสรรหา บรรจุและแต่งตั้ง, กลุ่มงานระบบข้อมูล ค่าตอบแทนและบำเหน็จความชอบ, กลุ่มงานวินัยและพิทักษ์ระบบคุณธรรม, งานฌาปนกิจสงเคราะห์ กระทรวงยุติธรรม.
- Provide structured committee creation, ownership assignment, document attachments, and real-time file counts for superadmin, admin, and user roles.

## Scope & Deliverables
- App Router routes: /committees, /committees/[id], modal creation flows, and dashboard snippets highlighting active command papers.
- Feature package under src/features/committees with list/detail server components, guarded client forms using Zod + React Hook Form, and owner lookup against profiles.
- Shared UI in src/components/committees for committee summary cards, file galleries, remark timelines, skeletons, and empty states.
- Supabase integration: repositories joining committees with files and profiles, bucket helpers for workfiles, and policies that enforce division_id plus owner-based access.
- Database migrations: enforce unique command_no per division, add search indexes on (command_no, title), and maintain updated_at timestamps; seeds include sample committees per division.
- Tests: Jest/RTL suites for list/detail rendering, MSW mocks for storage interactions, and Playwright coverage for create -> upload -> remark review -> delete flow.

## Implementation Plan
### Frontend
1. Build committee list with filters (division, owner, keyword, created_at range) and badge counts for attachments.
2. Implement detail route showing metadata, remarks, file gallery with preview/download options, and shareable breadcrumbs.
3. Compose reusable components for dashboard widgets and cross-feature file counters referencing committee IDs.

### Backend & Supabase
1. Define repositories that select committee data with filtered joins to files for live counts and uphold RBAC by division and role.
2. Author migrations for unique command_no per division, indexes, updated_at triggers, and RLS covering superadmin override, admin division scope, and user ownership.
3. Configure workfiles bucket policies, signed URL helpers, and storage cleanup routines for committee deletions.

### Data & QA
1. Seed committees per division with varying file counts, owners, and remarks to drive QA scripts.
2. Add Jest MSW tests validating repository filtering, signed URL generation, and access denial for cross-division queries.
3. Extend Playwright spec to exercise create -> attach file -> verify counts -> soft delete pattern, with screenshots for regression docs.

## Validation Checklist
- npm install
- npm run lint
- npm run test -- --coverage
- npm run build
- npx playwright test --project=chromium --grep "committees"
- supabase start
- supabase db push --dry-run
- supabase db reset
- rg "TODO|FIXME|WEBSEARCH_NEEDED" src supabase

## Success Criteria
- Committees list and detail enforce division-aware RBAC while exposing superadmin cross-division search.
- Real-time file counts derive from files table joins; no cached counters or denormalized columns.
- Storage policies restrict file downloads to committee members; signed URLs expire as configured.
- Filters and keyword search return under 200 ms on seeded dataset thanks to indexes.
- Automated coverage maintains >=80% branches for committee modules and Playwright scenario passes.

## Risks & Mitigations
- File sync drift -> implement storage cleanup hooks and nightly supabase storage audit script.
- RLS gaps on files -> add supabase start integration checks ensuring committee-based access and owner overrides.
- Command number collisions -> unique constraint plus human-readable error mapping in form handlers.
- Large attachment previews -> lazy load thumbnails and stream downloads to avoid blocking UI.

## Follow-up
- Introduce committee status workflow (draft, active, archived) and relate to task timelines.
- Add analytics for file volume per division and owner workload.
- Plan export interface (CSV/PDF) for command paper summaries.

**Confidence:** 8/10
