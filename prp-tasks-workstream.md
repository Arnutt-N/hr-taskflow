# PRP - Tasks Workflow Workstream

## Overview
- Deliver division-scoped task lifecycle across ฝ่ายบริหารทั่วไป, กลุ่มงานอัตรากำลังและกำหนดตำแหน่ง, กลุ่มงานสวัสดิการและเจ้าหน้าที่สัมพันธ์, กลุ่มงานสรรหา บรรจุและแต่งตั้ง, กลุ่มงานระบบข้อมูล ค่าตอบแทนและบำเหน็จความชอบ, กลุ่มงานวินัยและพิทักษ์ระบบคุณธรรม, งานฌาปนกิจสงเคราะห์ กระทรวงยุติธรรม.
- Provide multi-assignee coordination, status timelines, and filterable task work surfaces for superadmin, admin, and user roles.

## Scope & Deliverables
- App Router routes: /tasks, /tasks/[id], and dashboard widgets surfacing division queues and overdue counts.
- Feature package under src/features/tasks with server components for list/detail and guarded client editors that leverage Zod + React Hook Form.
- Shared UI in src/components/tasks for status timeline, assignment manager, filter toolbar, skeleton states, and file counter chips.
- Supabase integration: typed repositories, RPC or filtered queries, triggers for updated_at, indexes on (division_id, status, due_date), and RLS policies covering task ownership and task_assignments.
- Storage handling: optional workfiles bucket attachments with live count chips and role-aware upload/download helpers.
- Tests: Jest/RTL coverage for list/detail components, MSW-backed service tests, and Playwright scenarios from creation to assignment update.

## Implementation Plan
### Frontend
1. Build server-rendered task list with filter controls (status, division, date range, text) and pagination-ready data hooks.
2. Create detail route highlighting status timeline, assignment management, and file attachments with optimistic UI feedback.
3. Compose reusable widgets for dashboard summary cards, overdue alerts, and file counter badges consumable across divisions.

### Backend & Supabase
1. Define repositories ensuring eq('division_id', profile.division_id) scoping and join task_assignments for user-specific visibility checks.
2. Author migrations for status enum defaults, task_assignments unique index, updated_at triggers, and RLS that differentiates superadmin, admin, and user capabilities.
3. Wire Supabase functions for bulk status updates and ensure instrumentation for Playwright seeds and QA resets.

### Data & QA
1. Seed sample tasks per division with varied statuses, due dates, and multi-assignee combinations referencing seeded profiles.
2. Add Jest MSW tests for repository guards and service filtering; enforce branch coverage >=0.8 on tasks suites.
3. Expand Playwright spec covering create -> assign -> upload file -> mark done -> verify filtered list reflects updates.

## Validation Checklist
- npm install
- npm run lint
- npm run test -- --coverage
- npm run build
- npx playwright test --project=chromium --grep "tasks"
- supabase start
- supabase db push --dry-run
- supabase db reset
- rg "TODO|FIXME|WEBSEARCH_NEEDED" src supabase

## Success Criteria
- Task routes enforce division-aware RBAC; users see only owned or assigned tasks across all seven divisions.
- Status timeline reflects Supabase history with revalidation to avoid stale cache after mutations.
- Filters cover division, status, due_date range, and text search; results paginate without performance regressions.
- File counters pull live counts from files table scoped by task_id and role-based policies allow safe access.
- Coverage for task code paths keeps branch threshold >=80% and Playwright run passes end-to-end flows.

## Risks & Mitigations
- RLS omissions on task_assignments -> add integration tests using supabase start with policy assertions for each role.
- Filter performance -> add composite indexes on (division_id, status, due_date) and leverage Supabase range queries with debounced inputs.
- Real-time consistency -> trigger revalidation or Supabase channel subscription after state changes to avoid stale UI.
- Multi-assignee race conditions -> rely on database unique constraint and optimistic UI rollback logic on conflicts.

## Follow-up
- Explore Kanban board interactions for backlog grooming and capacity planning.
- Instrument analytics for cycle time, SLA breaches, and division bottlenecks.
- Plan comment/log feature integration or webhooks for downstream HR systems.

**Confidence:** 8/10
