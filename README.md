# hr-taskflow

Task tracking for Thai government HR document work: document number (เลขที่หนังสือ), document date, document type, e-Doc or paper source, confidential marking, inferred deadlines, and a KPI reference.

The app is Next.js 16 (App Router) with Prisma ORM 7.10 on MySQL. Prisma 8 does not ship a MySQL adapter, so this repo stays on the Prisma 7 MySQL client.

`https://github.com/Arnutt-N/taskflow-app` returned 404 from this environment (public clone and the installation token). The application was therefore built in this repository instead of copied from that tree. Existing git history on `main` is unchanged.

## Existing SQL

These files are kept as they were and are not applied by the app:

- `supabase/migrations/202409180001_initial_schema.sql`
- `supabase/seed/0001_divisions_and_users.sql`

They are a Postgres/Supabase design (RLS, `auth.users`, storage bucket `workfiles`, and the seven HR division names). The running store is `prisma/schema.prisma` on MySQL. Do not point `DATABASE_URL` at that Postgres schema.

## Setup

```bash
npm install
cp .env.example .env
```

Set `DATABASE_URL` to a MySQL or MariaDB database, for example:

```bash
DATABASE_URL="mysql://USER:PASSWORD@127.0.0.1:3306/hr_taskflow"
```

Apply the schema and start the app:

```bash
npx prisma migrate dev
npm run dev
```

`npm run db:migrate` runs `prisma migrate deploy` for an existing migration history. `npm run db:seed` inserts nothing and does not create tokens.

## API tokens

Bot routes require `Authorization: Bearer <token>`. The raw token is shown once and only its SHA-256 hash is stored.

```bash
npm run token:create -- --name "hr-bot"
```

Alternatively set `ADMIN_TOKEN` and `POST /api/admin/tokens`. See [docs/API.md](docs/API.md) for curl examples, filters, and the field list.

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Screens: `/`, `/tasks`, `/tasks/new`, `/tasks/[id]`, `/tasks/[id]/edit`. Confidential tasks show a ลับ mark and a masked document number in the list. The detail page loads the real number and body only after แสดงเนื้อหาลับ. An inferred deadline is labeled กำหนดส่งโดยประมาณ.

Those screens do not check a staff login. The bot API is the authenticated surface. Keep the site on a private network until staff sign-in is added. Hosting is otherwise undecided, and this repo does not add deployment config.
