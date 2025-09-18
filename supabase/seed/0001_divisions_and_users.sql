-- Seed divisions and baseline RBAC users for HR Taskflow
insert into public.divisions (name)
values
  ('ฝ่ายบริหารทั่วไป'),
  ('กลุ่มงานอัตรากำลังและกำหนดตำแหน่ง'),
  ('กลุ่มงานสวัสดิการและเจ้าหน้าที่สัมพันธ์'),
  ('กลุ่มงานสรรหา บรรจุและแต่งตั้ง'),
  ('กลุ่มงานระบบข้อมูล ค่าตอบแทนและบำเหน็จความชอบ'),
  ('กลุ่มงานวินัยและพิทักษ์ระบบคุณธรรม'),
  ('งานฌาปนกิจสงเคราะห์ กระทรวงยุติธรรม')
on conflict (name) do nothing;

-- Upsert baseline users
with creds(id, email, plain_secret) as (
  values
    ('11111111-1111-1111-1111-111111111111'::uuid, 'superadmin@example.com', 'Password123!'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'division-admin@example.com', 'Password123!'),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'standard-user@example.com', 'Password123!')
)
insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  created_at,
  updated_at,
  confirmation_sent_at,
  recovery_sent_at,
  aud,
  role,
  raw_user_meta_data,
  raw_app_meta_data,
  is_super_admin
)
select
  id,
  email,
  crypt(plain_secret, gen_salt('bf')),
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now()),
  'authenticated',
  'authenticated',
  '{}'::jsonb,
  jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
  false
from creds
on conflict (id) do update set
  email = excluded.email,
  updated_at = timezone('utc', now());

-- Upsert profile rows aligned to divisions
insert into public.profiles (id, full_name, role, division_id, active)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'Suphap HR Superadmin',
    'superadmin',
    (select id from public.divisions where name = 'ฝ่ายบริหารทั่วไป'),
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Wirote Division Admin',
    'admin',
    (select id from public.divisions where name = 'กลุ่มงานอัตรากำลังและกำหนดตำแหน่ง'),
    true
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Nicha HR Officer',
    'user',
    (select id from public.divisions where name = 'กลุ่มงานอัตรากำลังและกำหนดตำแหน่ง'),
    true
  )
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  division_id = excluded.division_id,
  active = excluded.active;
