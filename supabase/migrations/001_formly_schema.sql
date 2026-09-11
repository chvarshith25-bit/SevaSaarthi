-- ================================================================
-- FORMLY MVP — COMPLETE BACKEND SCHEMA (Supabase / Postgres)
-- Maps 1:1 to PRD sections 6-9 (F1-F10, NFR1-3)
-- No browser agent, no auto-submission, one hardcoded service.
-- ================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- 1. PROFILE FIELDS  (F2, F5, F6, NFR: no silent writes)
-- ----------------------------------------------------------------
create table if not exists profile_fields (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  field_name          text not null,        -- 'full_name','date_of_birth','annual_income', etc.
  value               text not null,
  source_document_id  uuid,                 -- FK added after documents table below
  confidence          numeric(4,3),         -- null if manually entered
  verified            boolean not null default false,
  confirmed_at        timestamptz,          -- set only when user explicitly confirms
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, field_name)
);

create index if not exists idx_profile_fields_user on profile_fields(user_id);

-- ----------------------------------------------------------------
-- 2. DOCUMENTS  (F3, F4)
-- ----------------------------------------------------------------
create table if not exists documents (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  document_type     text not null,          -- 'AADHAAR','INCOME_CERTIFICATE','COLLEGE_ID', etc.
  storage_path      text not null,
  original_filename text,
  mime_type         text,
  status            text not null default 'UPLOADED'
                      check (status in ('UPLOADED','PROCESSING','EXTRACTED','VERIFIED','FAILED')),
  ocr_raw_text      text,
  is_superseded     boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profile_fields_source_document_fk'
  ) then
    alter table profile_fields
      add constraint profile_fields_source_document_fk
      foreign key (source_document_id) references documents(id) on delete set null;
  end if;
end $$;

create index if not exists idx_documents_user on documents(user_id);
create index if not exists idx_documents_status on documents(status);

-- ----------------------------------------------------------------
-- 3. EXTRACTED FIELDS  (F4, F5 — staging area pre-confirmation)
-- ----------------------------------------------------------------
create table if not exists extracted_fields (
  id                uuid primary key default gen_random_uuid(),
  document_id       uuid not null references documents(id) on delete cascade,
  field_name        text not null,          -- shared vocabulary with profile_fields
  raw_value         text not null,
  normalized_value  text,
  confidence        numeric(4,3),
  accepted          boolean not null default false,  -- true once written into profile_fields
  created_at        timestamptz not null default now()
);

create index if not exists idx_extracted_fields_document on extracted_fields(document_id);

-- ----------------------------------------------------------------
-- 4. SERVICES  (one active row for MVP, table shaped for growth)
-- ----------------------------------------------------------------
create table if not exists services (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  official_url    text not null,
  official_domain text not null,
  category        text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- 5. SERVICE REQUIREMENTS  (F7, F9 — product-authored, static)
-- ----------------------------------------------------------------
create table if not exists service_requirements (
  id               uuid primary key default gen_random_uuid(),
  service_id       uuid not null references services(id) on delete cascade,
  requirement_type text not null
                     check (requirement_type in (
                       'IDENTITY_DOCUMENT','ADDRESS_DOCUMENT','INCOME_DOCUMENT',
                       'EDUCATION_DOCUMENT','BANK_DOCUMENT','PHOTO','SIGNATURE',
                       'PERSONAL_INFORMATION','DECLARATION'
                     )),
  field_name       text,        -- only for PERSONAL_INFORMATION: which profile field satisfies it
  label            text not null,
  required         boolean not null default true,
  guidance_text    text,        -- F9: static "how to typically get this" copy
  notes            text,        -- expected document_type for document requirements
  display_order    integer not null default 0,
  created_at       timestamptz not null default now()
);

create index if not exists idx_requirements_service on service_requirements(service_id);

-- ----------------------------------------------------------------
-- 6. REQUIREMENT STATUS  (F8, F9, F10 — source of truth for checklist)
-- One row per (user, requirement). Computed status AND manual
-- override live in the same row so the UI has one read path.
-- ----------------------------------------------------------------
create table if not exists requirement_status (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references auth.users(id) on delete cascade,
  requirement_id            uuid not null references service_requirements(id) on delete cascade,
  status                    text not null default 'MISSING'
                              check (status in ('MISSING','SATISFIED','MANUALLY_RESOLVED')),
  satisfied_by_document_id  uuid references documents(id) on delete set null,
  satisfied_by_field_name   text,
  resolved_note             text,       -- optional, only used when MANUALLY_RESOLVED
  locked                    boolean not null default false,  -- true when MANUALLY_RESOLVED, protects from auto-recompute
  updated_at                timestamptz not null default now(),
  unique (user_id, requirement_id)
);

create index if not exists idx_requirement_status_user on requirement_status(user_id);

-- ----------------------------------------------------------------
-- 7. Row Level Security — strict per-user isolation (NFR1)
-- ----------------------------------------------------------------
alter table profile_fields    enable row level security;
alter table documents         enable row level security;
alter table extracted_fields  enable row level security;
alter table services          enable row level security;
alter table service_requirements enable row level security;
alter table requirement_status enable row level security;

-- Drop existing policies if needed for idempotent replay
drop policy if exists "own profile fields" on profile_fields;
create policy "own profile fields" on profile_fields
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own documents" on documents;
create policy "own documents" on documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "extracted fields via own document" on extracted_fields;
create policy "extracted fields via own document" on extracted_fields
  for all using (
    exists (select 1 from documents d where d.id = document_id and d.user_id = auth.uid())
  );

drop policy if exists "own requirement status" on requirement_status;
create policy "own requirement status" on requirement_status
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "services are public read" on services;
create policy "services are public read" on services
  for select using (true);

drop policy if exists "requirements are public read" on service_requirements;
create policy "requirements are public read" on service_requirements
  for select using (true);

-- ================================================================
-- 8. REQUIREMENT MATCHING — Functions & Triggers
-- ================================================================

-- 8a. Recompute function
create or replace function recompute_requirement_status(p_user_id uuid, p_service_id uuid)
returns void as $$
begin
  -- 1. Ensure a row exists for every requirement of this service
  insert into requirement_status (user_id, requirement_id, status)
  select p_user_id, sr.id, 'MISSING'
  from service_requirements sr
  where sr.service_id = p_service_id
  on conflict (user_id, requirement_id) do nothing;

  -- 2. PERSONAL_INFORMATION requirements: satisfied if a verified profile_fields row exists
  update requirement_status rs
  set status = 'SATISFIED',
      satisfied_by_field_name = pf.field_name,
      satisfied_by_document_id = null,
      updated_at = now()
  from service_requirements sr
  join profile_fields pf
    on pf.user_id = p_user_id
   and pf.field_name = sr.field_name
   and pf.verified = true
   and length(trim(pf.value)) > 0
  where rs.requirement_id = sr.id
    and rs.user_id = p_user_id
    and sr.service_id = p_service_id
    and sr.requirement_type = 'PERSONAL_INFORMATION'
    and rs.locked = false;

  -- 3. DOCUMENT-type requirements: satisfied if any VERIFIED document of matching type exists
  update requirement_status rs
  set status = 'SATISFIED',
      satisfied_by_document_id = d.id,
      satisfied_by_field_name = null,
      updated_at = now()
  from service_requirements sr
  join documents d
    on d.user_id = p_user_id
   and d.status = 'VERIFIED'
   and d.document_type = sr.notes
  where rs.requirement_id = sr.id
    and rs.user_id = p_user_id
    and sr.service_id = p_service_id
    and sr.requirement_type != 'PERSONAL_INFORMATION'
    and rs.locked = false;

  -- 4. Revert any non-locked requirement that no longer meets satisfaction back to MISSING
  update requirement_status rs
  set status = 'MISSING',
      satisfied_by_document_id = null,
      satisfied_by_field_name = null,
      updated_at = now()
  from service_requirements sr
  where rs.requirement_id = sr.id
    and rs.user_id = p_user_id
    and sr.service_id = p_service_id
    and rs.locked = false
    and (
      (sr.requirement_type = 'PERSONAL_INFORMATION' and not exists (
        select 1 from profile_fields pf
        where pf.user_id = p_user_id
          and pf.field_name = sr.field_name
          and pf.verified = true
          and length(trim(pf.value)) > 0
      ))
      or
      (sr.requirement_type != 'PERSONAL_INFORMATION' and not exists (
        select 1 from documents d
        where d.user_id = p_user_id
          and d.status = 'VERIFIED'
          and d.document_type = sr.notes
      ))
    );
end;
$$ language plpgsql security definer;

-- 8b. Manual resolution (F10)
create or replace function mark_requirement_resolved(
  p_user_id uuid, p_requirement_id uuid, p_note text default null
) returns void as $$
begin
  insert into requirement_status (user_id, requirement_id, status, resolved_note, locked)
  values (p_user_id, p_requirement_id, 'MANUALLY_RESOLVED', p_note, true)
  on conflict (user_id, requirement_id)
  do update set status = 'MANUALLY_RESOLVED',
                resolved_note = excluded.resolved_note,
                locked = true,
                updated_at = now();
end;
$$ language plpgsql security definer;

-- 8c. Unmark manual resolution (revert to computed)
create or replace function unmark_requirement_resolved(
  p_user_id uuid, p_requirement_id uuid
) returns void as $$
declare
  v_service_id uuid;
begin
  update requirement_status
  set locked = false,
      resolved_note = null
  where user_id = p_user_id and requirement_id = p_requirement_id;

  select service_id into v_service_id from service_requirements where id = p_requirement_id;
  if v_service_id is not null then
    perform recompute_requirement_status(p_user_id, v_service_id);
  end if;
end;
$$ language plpgsql security definer;

-- 8d. Triggers
create or replace function trg_recompute_on_profile_change() returns trigger as $$
begin
  if new.verified = true or (tg_op = 'UPDATE' and old.verified = true and new.verified = false) then
    perform recompute_requirement_status(new.user_id, s.id)
    from services s where s.is_active = true;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists profile_fields_recompute on profile_fields;
create trigger profile_fields_recompute
  after insert or update on profile_fields
  for each row execute function trg_recompute_on_profile_change();

create or replace function trg_recompute_on_document_verified() returns trigger as $$
begin
  if new.status = 'VERIFIED' or (tg_op = 'UPDATE' and old.status = 'VERIFIED' and new.status != 'VERIFIED') then
    perform recompute_requirement_status(new.user_id, s.id)
    from services s where s.is_active = true;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists documents_recompute on documents;
create trigger documents_recompute
  after update on documents
  for each row execute function trg_recompute_on_document_verified();
