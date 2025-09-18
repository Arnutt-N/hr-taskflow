# Execute Project PRP

## PRP File
- Active brief: $ARGUMENTS
- Companion docs: `master-prompt.md`, `prp_base.md`, `AGENTS.md`, relevant feature PRPs

## Execution Process (Adapted from examples/execute-template-prp.md)
1. **Load the Prompt**
   - Read the feature PRP, `master-prompt.md`, `prp_base.md`, `AGENTS.md`, and any supporting docs in full.
   - Capture required screens, Supabase tables, RLS policies, and division-specific flows.
2. **ULTRATHINK Planning**
   - Decompose work into frontend, backend, data, and QA tracks.
   - Map tasks to concrete files (for example `src/app/(dashboard)/page.tsx`, `supabase/migrations/*`).
   - Identify blocking dependencies (migrations before UI, storage bucket policies before uploads).
3. **Implement**
   - Follow Next.js App Router conventions for routes, loaders, and server actions.
   - Update Supabase migrations, seeds, and storage policies; keep division names verbatim.
   - Integrate Zod + React Hook Form validation, shadcn/ui components, and Tailwind tokens.
   - Document new environment variables in `.env.example` and `supabase/.env`; avoid committing secrets.
4. **Self-Review**
   - Reconcile implementations against the PRP's success criteria and acceptance tests.
   - Confirm RLS rules enforce `superadmin`, `admin`, and `user` scopes; file counts remain query-driven.
   - Prepare PR notes covering scope, screenshots, Supabase actions, and validation steps.

## Validation Commands
```bash
# Install & Static Checks
npm install
npm run lint
npm run test -- --coverage
npm run build

# E2E (if specs exist)
npx playwright test

# Supabase Tooling
supabase start
supabase db lint
supabase db push --dry-run
supabase db reset
supabase gen types typescript --local  # when API types change

# Content Hygiene
git status --short
rg "TODO|FIXME|WEBSEARCH_NEEDED" src supabase
```
Add feature-specific scripts (storybook, bundle analysis, seed refresh) when directed by the PRP.

## Quality Gates
- All acceptance criteria from the PRP and `master-prompt.md` satisfied.
- UI matches semi-dark HR admin style, responsive layouts, skeletons, toasts, and filtering behavior.
- Supabase migrations, seeds, and RLS policies applied and verified locally.
- Test and coverage thresholds (>=80%) met; Playwright flows updated when UX changes.
- Environment variables documented; secrets excluded from git history.
- Changelogs or PR descriptions include verification checklist and screenshots or Looms.
- Confidence score >=8/10; if lower, revisit plan and fill gaps before handoff.
