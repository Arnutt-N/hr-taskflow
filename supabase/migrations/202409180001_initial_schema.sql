-- Initial schema for HR Taskflow MVP
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

create type public.user_role as enum ('superadmin', 'admin', 'user');
create type public.task_status as enum ('waiting', 'in_process', 'done');

create table if not exists public.divisions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'user',
  division_id uuid references public.divisions(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.committees (
  id uuid primary key default gen_random_uuid(),
  command_no text not null,
  title text not null,
  detail text,
  owner uuid references public.profiles(id),
  remark text,
  created_by uuid references public.profiles(id),
  division_id uuid not null references public.divisions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (division_id, command_no)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  task text not null,
  detail text,
  status public.task_status not null default 'waiting',
  date_start date,
  date_end date,
  due_date date,
  remark text,
  created_by uuid references public.profiles(id),
  division_id uuid not null references public.divisions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  assignee_id uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  unique (task_id, assignee_id)
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  owner_id uuid references public.profiles(id),
  committee_id uuid references public.committees(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

create index if not exists idx_tasks_division_status_due on public.tasks (division_id, status, due_date);
create index if not exists idx_tasks_created_by on public.tasks (created_by);
create index if not exists idx_committees_division_title on public.committees (division_id, title);
create index if not exists idx_task_assignments_task on public.task_assignments (task_id);
create index if not exists idx_task_assignments_assignee on public.task_assignments (assignee_id);
create index if not exists idx_files_task on public.files (task_id);
create index if not exists idx_files_committee on public.files (committee_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_committees_updated_at
  before update on public.committees
  for each row execute procedure public.set_updated_at();

create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_division_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select division_id from public.profiles where id = auth.uid();
$$;

alter table public.divisions enable row level security;
alter table public.profiles enable row level security;
alter table public.committees enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.files enable row level security;
alter table storage.objects enable row level security;

create policy if not exists "superadmin manage divisions" on public.divisions
  for all using (public.current_user_role() = 'superadmin')
  with check (public.current_user_role() = 'superadmin');

create policy if not exists "authenticated read divisions" on public.divisions
  for select using (public.current_user_role() is not null);

create policy if not exists "superadmin manage profiles" on public.profiles
  for all using (public.current_user_role() = 'superadmin')
  with check (public.current_user_role() = 'superadmin');

create policy if not exists "admins manage division profiles" on public.profiles
  for insert using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin' and division_id = public.current_user_division_id());

create policy if not exists "admins update division profiles" on public.profiles
  for update using (public.current_user_role() = 'admin' and division_id = public.current_user_division_id())
  with check (division_id = public.current_user_division_id());

create policy if not exists "admins view division profiles" on public.profiles
  for select using (public.current_user_role() = 'admin' and division_id = public.current_user_division_id());

create policy if not exists "users manage own profile" on public.profiles
  for select using (id = auth.uid())
  with check (id = auth.uid());

create policy if not exists "superadmin manage tasks" on public.tasks
  for all using (public.current_user_role() = 'superadmin')
  with check (public.current_user_role() = 'superadmin');

create policy if not exists "admins manage division tasks" on public.tasks
  for insert using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin' and division_id = public.current_user_division_id());

create policy if not exists "admins update division tasks" on public.tasks
  for update using (public.current_user_role() = 'admin' and division_id = public.current_user_division_id())
  with check (division_id = public.current_user_division_id());

create policy if not exists "admins delete division tasks" on public.tasks
  for delete using (public.current_user_role() = 'admin' and division_id = public.current_user_division_id());

create policy if not exists "admins read division tasks" on public.tasks
  for select using (public.current_user_role() = 'admin' and division_id = public.current_user_division_id());

create policy if not exists "users create personal tasks" on public.tasks
  for insert using (public.current_user_role() = 'user')
  with check (created_by = auth.uid() and division_id = public.current_user_division_id());

create policy if not exists "users update personal tasks" on public.tasks
  for update using (
    public.current_user_role() = 'user'
    and created_by = auth.uid()
  ) with check (
    created_by = auth.uid()
  );

create policy if not exists "users view accessible tasks" on public.tasks
  for select using (
    (public.current_user_role() = 'user' or public.current_user_role() is null)
    and (
      created_by = auth.uid()
      or exists (
        select 1 from public.task_assignments ta
        where ta.task_id = public.tasks.id and ta.assignee_id = auth.uid()
      )
    )
  );

create policy if not exists "superadmin manage committees" on public.committees
  for all using (public.current_user_role() = 'superadmin')
  with check (public.current_user_role() = 'superadmin');

create policy if not exists "admins manage division committees" on public.committees
  for insert using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin' and division_id = public.current_user_division_id());

create policy if not exists "admins update division committees" on public.committees
  for update using (public.current_user_role() = 'admin' and division_id = public.current_user_division_id())
  with check (division_id = public.current_user_division_id());

create policy if not exists "admins delete division committees" on public.committees
  for delete using (public.current_user_role() = 'admin' and division_id = public.current_user_division_id());

create policy if not exists "admins read division committees" on public.committees
  for select using (public.current_user_role() = 'admin' and division_id = public.current_user_division_id());

create policy if not exists "users read assigned committees" on public.committees
  for select using (
    (public.current_user_role() = 'user' or public.current_user_role() is null)
    and (
      owner = auth.uid()
      or created_by = auth.uid()
    )
  );

create policy if not exists "superadmin manage task assignments" on public.task_assignments
  for all using (public.current_user_role() = 'superadmin')
  with check (public.current_user_role() = 'superadmin');

create policy if not exists "admins manage division task assignments" on public.task_assignments
  for all using (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.tasks t
      where t.id = task_id and t.division_id = public.current_user_division_id()
    )
  ) with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and t.division_id = public.current_user_division_id()
    )
  );

create policy if not exists "users manage own assignments" on public.task_assignments
  for select using (
    assignee_id = auth.uid()
    or exists (
      select 1 from public.tasks t
      where t.id = task_id and t.created_by = auth.uid()
    )
  );

create policy if not exists "superadmin manage files" on public.files
  for all using (public.current_user_role() = 'superadmin')
  with check (public.current_user_role() = 'superadmin');

create policy if not exists "admins manage division files" on public.files
  for all using (
    public.current_user_role() = 'admin'
    and (
      exists (select 1 from public.tasks t where t.id = public.files.task_id and t.division_id = public.current_user_division_id())
      or exists (select 1 from public.committees c where c.id = public.files.committee_id and c.division_id = public.current_user_division_id())
    )
  ) with check (
    (
      task_id is null or exists (select 1 from public.tasks t where t.id = public.files.task_id and t.division_id = public.current_user_division_id())
    )
    and (
      committee_id is null or exists (select 1 from public.committees c where c.id = public.files.committee_id and c.division_id = public.current_user_division_id())
    )
  );

create policy if not exists "users manage related files" on public.files
  for select using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.tasks t
      join public.task_assignments ta on ta.task_id = t.id
      where t.id = public.files.task_id and (t.created_by = auth.uid() or ta.assignee_id = auth.uid())
    )
    or exists (
      select 1 from public.committees c where c.id = public.files.committee_id and (c.owner = auth.uid() or c.created_by = auth.uid())
    )
  );

insert into storage.buckets (id, name, public)
values ('workfiles', 'workfiles', false)
on conflict (id) do nothing;

create policy if not exists "workfiles superadmin access" on storage.objects
  for all using (bucket_id = 'workfiles' and public.current_user_role() = 'superadmin')
  with check (bucket_id = 'workfiles' and public.current_user_role() = 'superadmin');

create policy if not exists "workfiles admin access" on storage.objects
  for all using (
    bucket_id = 'workfiles'
    and public.current_user_role() = 'admin'
    and exists (
      select 1 from public.files f
      left join public.tasks t on t.id = f.task_id
      left join public.committees c on c.id = f.committee_id
      where f.bucket = storage.objects.bucket_id
        and f.path = storage.objects.name
        and (
          (t.id is not null and t.division_id = public.current_user_division_id())
          or (c.id is not null and c.division_id = public.current_user_division_id())
        )
    )
  ) with check (
    bucket_id = 'workfiles'
  );

create policy if not exists "workfiles user access" on storage.objects
  for select using (
    bucket_id = 'workfiles'
    and exists (
      select 1 from public.files f
      left join public.tasks t on t.id = f.task_id
      left join public.task_assignments ta on ta.task_id = f.task_id and ta.assignee_id = auth.uid()
      left join public.committees c on c.id = f.committee_id
      where f.bucket = storage.objects.bucket_id
        and f.path = storage.objects.name
        and (
          f.owner_id = auth.uid()
          or (t.id is not null and (t.created_by = auth.uid() or ta.assignee_id = auth.uid()))
          or (c.id is not null and (c.owner = auth.uid() or c.created_by = auth.uid()))
        )
    )
  );
