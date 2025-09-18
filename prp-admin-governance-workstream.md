# PRP - Admin & Division Governance Workstream

## Overview
- Enable governance over roles, activation, and division metadata for ฝ่ายบริหารทั่วไป, กลุ่มงานอัตรากำลังและกำหนดตำแหน่ง, กลุ่มงานสวัสดิการและเจ้าหน้าที่สัมพันธ์, กลุ่มงานสรรหา บรรจุและแต่งตั้ง, กลุ่มงานระบบข้อมูล ค่าตอบแทนและบำเหน็จความชอบ, กลุ่มงานวินัยและพิทักษ์ระบบคุณธรรม, งานฌาปนกิจสงเคราะห์ กระทรวงยุติธรรม.
- Provide superadmin and admin tooling for user onboarding, role changes, division edits, and status toggles with auditability.

## Scope & Deliverables
- App Router routes: /admin/users, /admin/divisions, supporting modals for invite, deactivate, reset password links, and division CRUD.
- Feature module under src/features/admin with server components for grid views and guarded client actions powered by Zod + React Hook Form.
- Shared UI in src/components/admin for role badges, activation toggles, invite wizard, and audit log timeline components.
- Supabase integration: repositories joining profiles with auth.users metadata, RPC helpers for role changes, and logging hooks for audit trails.
- Database migrations: ensure profiles.active defaults, add role enum constraints, division unique indexes, and seed baseline division records.
- Tests: Jest/RTL coverage for admin tables, MSW-backed service tests for role mutations, Playwright regression for invite -> activation -> division edit flows.

## Implementation Plan
### Frontend
1. Build admin tables with column filters (role, division, status) and inline actions, leveraging server components with streaming skeletons.
2. Implement modals and forms for inviting users, editing roles, and updating division metadata with optimistic UI and toast feedback.
3. Create audit log timeline component to surface recent changes and integrate with dashboard notifications.

### Backend & Supabase
1. Define repositories enforcing superadmin overrides and admin division scoping; prohibit user role escalation without proper claims.
2. Author migrations for roles enum, division unique indexes, and triggers capturing audit entries into an admin_logs table.
3. Implement RPC or edge functions for invite issuance, role updates, and division changes while recording events for analytics.

### Data & QA
1. Seed superadmin, division admins, and users per division with realistic metadata; document onboarding checklist.
2. Add Jest MSW tests verifying role update permissions, division edit constraints, and invite token flows.
3. Expand Playwright suite covering superadmin invite -> email link (stub) -> profile activation, plus admin division rename with rollback.

## Validation Checklist
- npm install
- npm run lint
- npm run test -- --coverage
- npm run build
- npx playwright test --project=chromium --grep "admin"
- supabase start
- supabase db push --dry-run
- supabase db reset
- rg "TODO|FIXME|WEBSEARCH_NEEDED" src supabase

## Success Criteria
- Admin routes enforce RBAC: superadmin cross-division control, admins limited to their division, users denied access.
- Invites and role changes update Supabase auth and profiles consistently, with audit entries stored and queryable.
- Division edits propagate to dependent dropdowns and task/committee filters without stale cache.
- Coverage for admin modules remains >=80% branches and Playwright admin scenarios pass reliably.
- Validation checklist executes cleanly on fresh clones and after supabase db reset.

## Risks & Mitigations
- Privilege escalation bugs -> add policy unit tests and explicit role assertions in repositories.
- Audit log growth -> partition admin_logs table, add retention policy, and expose exports for compliance.
- Invite token misuse -> enforce one-time tokens with expirations and track failed attempts.
- Division rename drift -> add cascading update strategy or background job to sync references.

## Follow-up
- Integrate email templates for invites and activation reminders.
- Surface admin analytics (active users per division, role change history) on dashboard.
- Plan feature flag system for staged rollout of new HR capabilities.

**Confidence:** 8/10
