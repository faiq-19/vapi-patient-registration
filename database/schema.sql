create table if not exists public.patients (
  patient_id uuid primary key default gen_random_uuid(),
  first_name varchar(50) not null check (first_name ~ '^[A-Za-zÀ-ÿ''-]+$'),
  last_name varchar(50) not null check (last_name ~ '^[A-Za-zÀ-ÿ''-]+$'),
  date_of_birth date not null check (date_of_birth <= current_date),
  sex varchar(20) not null check (sex in ('Male','Female','Other','Decline to Answer')),
  phone_number varchar(10) not null check (phone_number ~ '^[0-9]{10}$'),
  email varchar(255),
  address_line_1 varchar(255) not null,
  address_line_2 varchar(255),
  city varchar(100) not null,
  state char(2) not null check (state ~ '^[A-Z]{2}$'),
  zip_code varchar(10) not null check (zip_code ~ '^[0-9]{5}(-[0-9]{4})?$'),
  insurance_provider varchar(150),
  insurance_member_id varchar(100),
  preferred_language varchar(50) default 'English',
  emergency_contact_name varchar(150),
  emergency_contact_phone varchar(10) check (emergency_contact_phone is null or emergency_contact_phone ~ '^[0-9]{10}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.patients enable row level security;
grant select, insert, update, delete on public.patients to service_role;
create index if not exists patients_phone_idx on public.patients(phone_number) where deleted_at is null;
create index if not exists patients_last_name_idx on public.patients(last_name) where deleted_at is null;
