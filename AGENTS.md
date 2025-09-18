# Repository Guidelines

## Project Structure & Module Organization
Follow the architecture defined in `master-prompt.md`. Build App Router routes under `src/app`, grouping flows by division in feature folders (e.g., `src/features/tasks`, `src/features/committees`) with shared utilities in `src/lib` and reusable UI in `src/components`. Supabase server helpers live in `src/server/supabase`. Database migrations and seeds stay under `supabase/migrations` and `supabase/seed`; keep the division names aligned with the source list in `master-prompt.md`. Store static assets in `public/` and configuration files at the repo root. Reference `prp_base.md` and any feature PRPs checked into the repo for workstream-specific details.

## Build, Test, and Development Commands
Run `npm install` to restore packages. Use `npm run dev` for the local server on port 3000, `npm run lint` for ESLint/Prettier checks, `npm run test` for Jest suites, and `npm run build` for production output. Start Supabase locally with `supabase start`, apply schema changes with `supabase db push`, and reset seed data via `supabase db reset` before QA reviews.

## Coding Style & Naming Conventions
Write modern TypeScript with strict mode enabled. Use 2-space indentation, prefer functional React components, and favor server components until interactivity is required. Name route files in kebab-case, components in PascalCase, and utilities in camelCase. Keep services and repositories pure; surface validation through shared Zod schemas. Run `npm run lint -- --fix` before committing.

## Testing Guidelines
Use Jest and React Testing Library for unit and integration coverage. Place component tests next to their source as `*.test.tsx`; cross-feature or API tests live in `tests/`. Add Playwright specs for critical flows (/login, dashboard KPIs, task CRUD). Aim for >=80% branch coverage and document new fixtures under `tests/fixtures`. Mock Supabase interactions with MSW or Supabase test clients.

## Commit & Pull Request Guidelines
Adopt Conventional Commits (`feat(tasks): add status timeline widget`) and reference tracking IDs (`HR-123`). Each PR should include a short summary, linked issues, screenshots or Looms for UI updates, Supabase migration notes, and validation steps (lint, test, Supabase reset). Request reviews from the owning division lead and ensure CI checks remain green before merge.

## Environment & Secrets
Track required variables in `.env.example`; developers load them via `.env.local` and `supabase/.env`. Never commit live credentials. Use the team secret manager and Supabase dashboard for production keys, rotating immediately if exposed.
