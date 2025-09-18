# 🔧 Master Prompt (Copy & Use)

## Goal

Build a **Task Management Web App** for HR divisions that supports delegation, tracking, command papers, and workflow processes. The system must separate and filter tasks by **divisions**:

* ฝ่ายบริหารทั่วไป
* กลุ่มงานอัตรากำลังและกำหนดตำแหน่ง
* กลุ่มงานสวัสดิการและเจ้าหน้าที่สัมพันธ์
* กลุ่มงานสรรหา บรรจุและแต่งตั้ง
* กลุ่มงานระบบข้อมูล ค่าตอบแทนและบำเหน็จความชอบ
* กลุ่มงานวินัยและพิทักษ์ระบบคุณธรรม
* งานฌาปนกิจสงเคราะห์ กระทรวงยุติธรรม

---

## Required Technologies

* **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS; use modern UI libraries (e.g., `shadcn/ui`) + elegant modals; **semi-dark admin panel** style
* **Backend & DB:** Supabase (Postgres + Auth + RLS + Storage)
* **Authentication:** Email/Password login + password reset via email (Supabase Auth)
* **RBAC:** Roles → `superadmin`, `admin`, `user` (stored in `auth.users`/`profiles`)
* **File Management:** Supabase Storage bucket with access policies
* **Code Quality:** Layered architecture (service/repo), Zod validation, React Hook Form

---

## Core Features

### Authentication & RBAC

* User signup, login, password reset via email
* User profile (`profiles`): `full_name`, `role`, `division_id`, `active`
* Route guards and component-level protection based on role

### Divisions

* Division-based filtering and user assignment

### Committees (Command Papers)

* CRUD: `command_no`, `title`, `detail`, `owner`, `remark`
* Attach files (via Supabase Storage) and show **real-time file counts**

### Tasks

* CRUD: `task`, `detail`, `status (waiting | in_process | done)`, `date_start`, `date_end`, `due_date`, `remark`
* Multi-assignee support (via `task_assignments` table)
* Optional: comments/logs for status changes
* Filtering & sorting (text, status, division, date range)

### Admin Panel (Semi-Dark UI)

* **Dashboard:** task summary by status, overdue alerts, division queues
* **Management Pages:** Users, Divisions, Committees, Tasks, Files
* Modern modals for confirmation & warnings

### UX/UI

* HR-tech startup feel: cards, grids, icons, skeleton loaders, empty states, toasts
* Fully responsive (desktop/tablet/mobile)
* **Optional:** i18n-ready (English/Thai)

---

## Database Schema (Migrations + Seed)

### `profiles` (linked with `auth.users`)

* `id` (uuid, PK, references `auth.users.id`)
* `full_name` (text)
* `role` (enum: `superadmin | admin | user`)
* `division_id` (uuid, references `divisions(id)`)
* `active` (boolean, default `true`)
* `created_at`, `updated_at`

### `divisions`

* `id` (uuid, PK, default `gen_random_uuid()`)
* `name` (text, unique, not null)
* `created_at`

### `committees`

* `id` (uuid, PK)
* `command_no` (text, not null)
* `title` (text, not null)
* `detail` (text)
* `owner` (uuid, references `profiles(id)`)
* `remark` (text)
* `created_by` (uuid, references `profiles(id)`)
* `division_id` (uuid, references `divisions(id)`)
* `created_at`, `updated_at`

### `tasks`

* `id` (uuid, PK)
* `task` (text, not null)
* `detail` (text)
* `status` (enum: `waiting | in_process | done`, default `waiting`)
* `date_start` (date)
* `date_end` (date)
* `due_date` (date)
* `remark` (text)
* `created_by` (uuid, references `profiles(id)`)
* `division_id` (uuid, references `divisions(id)`)
* `created_at`, `updated_at`

### `task_assignments`

* `id` (uuid, PK)
* `task_id` (uuid, references `tasks(id)` on delete cascade)
* `assignee_id` (uuid, references `profiles(id)`)
* `assigned_at` (timestamptz, default `now()`)
* `unique (task_id, assignee_id)`

### `files`

* `id` (uuid, PK)
* `bucket` (text, e.g., `workfiles`)
* `path` (text)
* `owner_id` (uuid, references `profiles(id)`)
* `committee_id` (uuid, nullable, references `committees(id)` on delete set null)
* `task_id` (uuid, nullable, references `tasks(id)` on delete set null)
* `created_at`

> **Storage:** Create bucket `workfiles` with policies restricting read/write to authorized users

---

## RLS Policy (Required)

* **User:** Can only view/edit data from their own division and tasks where they are owner/assignee
* **Admin:** Full access within their division
* **Superadmin:** Full access across all divisions
* **File count:** Must be computed dynamically from `files` table (no redundant number fields)

---

## Required Screens

* `/login`, `/reset-password`
* `/dashboard` → Task summary (by status, overdue, by division)
* `/committees` + detail page
* `/tasks` + detail page (status timeline + assignees)
* `/admin/users`, `/admin/divisions`
* File upload/management page (integrated with Storage)
* Search/filter on all list pages
* Modals: confirm delete, deadline warning, success toasts


