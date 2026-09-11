-- =====================================================================
-- FORMly V2 — UNIFIED BACKEND SCHEMA
-- Citizen + Government + Interoperability + Workflow
-- PostgreSQL / Supabase
--
-- PURPOSE
--   One canonical application lifecycle shared by both sides of FORMly.
--   Citizen and government users see permission-scoped views of the same
--   application, workflow and event data.
--
-- IMPORTANT PRODUCT RULES
--   1. AI can explain, summarize and flag; AI cannot APPROVE/REJECT.
--   2. Officer decisions are stored separately from AI output.
--   3. Return/reject reasons become structured correction/explanation input.
--   4. Every important state transition is recorded with an actor.
--   5. State transitions are explicit; arbitrary status jumps are blocked
--      by the transition function.
--   6. External calls are idempotent and retryable.
--   7. Raw sensitive connector payloads are NOT stored by default.
--   8. Physical-card processing is OPTIONAL and separate from e-PAN.
--   9. Government connectors are abstractions; DEMO/SANDBOX/PRODUCTION
--      environments are explicitly represented.
--  10. Citizen UI never receives government-only data directly.
--
-- PAN DEMO MODEL
--   Apply
--    -> Validate
--    -> Consent
--    -> Verify
--    -> Cross-system validation
--    -> Service-specific processing
--    -> Human review only when workflow requires it / exception occurs
--    -> e-PAN generated
--    -> OPTIONAL physical-card request
--         -> printing -> dispatch -> delivery
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- =====================================================================
-- 0. COMMON FUNCTIONS
-- =====================================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- 1. CITIZEN PROFILE
-- =====================================================================

create table if not exists profiles (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  profile_version      integer not null default 1 check (profile_version > 0),
  profile_status       text not null default 'INCOMPLETE'
                       check (profile_status in ('INCOMPLETE','READY','LOCKED')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
before update on profiles
for each row execute function set_updated_at();

-- Backfill profiles for any existing users from auth.users or profile_fields
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profile_fields') then
    insert into profiles (user_id)
    select distinct user_id from profile_fields
    where user_id is not null
    on conflict (user_id) do nothing;
  end if;
end $$;

create table if not exists profile_fields (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references profiles(user_id) on delete cascade,
  field_key            text not null,
  value                text,
  source_document_id   uuid,
  confidence           numeric(4,3)
                       check (confidence is null or confidence between 0 and 1),
  verification_status  text not null default 'UNVERIFIED'
                       check (verification_status in (
                         'UNVERIFIED','VERIFIED','CONFLICT','NEEDS_REVIEW'
                       )),
  confirmed_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique(user_id, field_key)
);

-- Reconcile V1 profile_fields if already created with V1 columns
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profile_fields' and column_name = 'field_name') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profile_fields' and column_name = 'field_key') then
      alter table profile_fields add column field_key text;
      update profile_fields set field_key = field_name where field_key is null;
      alter table profile_fields alter column field_key set not null;
    end if;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profile_fields' and column_name = 'value') then
    alter table profile_fields alter column value drop not null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profile_fields_user_id_field_key_key') then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profile_fields' and column_name = 'field_key') then
      alter table profile_fields add constraint profile_fields_user_id_field_key_key unique (user_id, field_key);
    end if;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profile_fields' and column_name = 'verification_status') then
    alter table profile_fields add column verification_status text not null default 'UNVERIFIED'
      check (verification_status in ('UNVERIFIED','VERIFIED','CONFLICT','NEEDS_REVIEW'));
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profile_fields' and column_name = 'verified') then
      update profile_fields set verification_status = case when verified = true then 'VERIFIED' else 'UNVERIFIED' end;
    end if;
  end if;

  -- Clean up legacy V1 trigger that expects V1 columns
  drop trigger if exists profile_fields_recompute on profile_fields;
end $$;

create index if not exists idx_profile_fields_user on profile_fields(user_id);
create index if not exists idx_profile_fields_key on profile_fields(field_key);

drop trigger if exists profile_fields_set_updated_at on profile_fields;
create trigger profile_fields_set_updated_at
before update on profile_fields
for each row execute function set_updated_at();

-- =====================================================================
-- 2. DOCUMENT VAULT / OCR
-- =====================================================================

create table if not exists documents (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references profiles(user_id) on delete cascade,
  document_type        text not null,
  storage_path         text not null,
  original_filename    text,
  mime_type            text,
  sha256_hash          text,
  status               text not null default 'UPLOADED'
                       check (status in (
                         'UPLOADED','PROCESSING','EXTRACTED','VERIFIED',
                         'FAILED','RETIRED'
                       )),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Reconcile documents from V1 (add sha256_hash if missing and allow RETIRED status)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'documents' and column_name = 'sha256_hash') then
    alter table documents add column sha256_hash text;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'documents') then
    alter table documents drop constraint if exists documents_status_check;
    alter table documents add constraint documents_status_check check (
      status in ('UPLOADED','PROCESSING','EXTRACTED','VERIFIED','FAILED','RETIRED')
    );
  end if;

  -- Clean up legacy V1 trigger
  drop trigger if exists documents_recompute on documents;
end $$;

create index if not exists idx_documents_user on documents(user_id);
create index if not exists idx_documents_type on documents(document_type);
create index if not exists idx_documents_status on documents(status);

create unique index if not exists uq_documents_user_hash
on documents(user_id, sha256_hash)
where sha256_hash is not null;

drop trigger if exists documents_set_updated_at on documents;
create trigger documents_set_updated_at
before update on documents
for each row execute function set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profile_fields_source_document_fk'
  ) then
    alter table profile_fields
      add constraint profile_fields_source_document_fk
      foreign key (source_document_id)
      references documents(id)
      on delete set null;
  end if;
end $$;

create table if not exists extracted_fields (
  id                   uuid primary key default gen_random_uuid(),
  document_id          uuid not null references documents(id) on delete cascade,
  field_key            text not null,
  extracted_value      text,
  confidence           numeric(4,3)
                       check (confidence is null or confidence between 0 and 1),
  accepted             boolean not null default false,
  accepted_at          timestamptz,
  created_at           timestamptz not null default now(),
  unique(document_id, field_key)
);

-- Reconcile extracted_fields if field_key / extracted_value missing
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'extracted_fields' and column_name = 'field_name') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'extracted_fields' and column_name = 'field_key') then
      alter table extracted_fields add column field_key text;
      update extracted_fields set field_key = field_name where field_key is null;
      alter table extracted_fields alter column field_key set not null;
    end if;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'extracted_fields' and column_name = 'raw_value') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'extracted_fields' and column_name = 'extracted_value') then
      alter table extracted_fields add column extracted_value text;
      update extracted_fields set extracted_value = raw_value where extracted_value is null;
    end if;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'extracted_fields' and column_name = 'accepted_at') then
    alter table extracted_fields add column accepted_at timestamptz;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'extracted_fields_document_id_field_key_key') then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'extracted_fields' and column_name = 'field_key') then
      alter table extracted_fields add constraint extracted_fields_document_id_field_key_key unique (document_id, field_key);
    end if;
  end if;
end $$;

create index if not exists idx_extracted_fields_document on extracted_fields(document_id);

-- =====================================================================
-- 3. GOVERNMENT ORGANIZATION
-- =====================================================================

create table if not exists departments (
  id                   uuid primary key default gen_random_uuid(),
  code                 text not null unique,
  name                 text not null,
  government_level     text not null default 'STATE'
                       check (government_level in (
                         'CENTRAL','STATE','DISTRICT','LOCAL','OTHER'
                       )),
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

drop trigger if exists departments_set_updated_at on departments;
create trigger departments_set_updated_at
before update on departments
for each row execute function set_updated_at();

create table if not exists offices (
  id                   uuid primary key default gen_random_uuid(),
  department_id        uuid not null references departments(id) on delete restrict,
  code                 text not null,
  name                 text not null,
  city                 text,
  state                text,
  pincode              text,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  unique(department_id, code)
);

create index if not exists idx_offices_department on offices(department_id);

create table if not exists employees (
  id                    uuid primary key default gen_random_uuid(),
  auth_user_id          uuid unique references auth.users(id) on delete set null,
  employee_code         text not null unique,
  full_name             text not null,
  email                 text,
  department_id         uuid references departments(id),
  office_id             uuid references offices(id),
  role                  text not null
                        check (role in (
                          'DEPARTMENT_OFFICER',
                          'DEPARTMENT_ADMIN',
                          'SYSTEM_ADMIN'
                        )),
  is_active              boolean not null default true,
  max_concurrent_cases  integer not null default 15
                        check (max_concurrent_cases > 0),
  current_active_cases  integer not null default 0
                        check (current_active_cases >= 0),
  last_active_at        timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_employees_department on employees(department_id);
create index if not exists idx_employees_office on employees(office_id);
create index if not exists idx_employees_role on employees(role);

drop trigger if exists employees_set_updated_at on employees;
create trigger employees_set_updated_at
before update on employees
for each row execute function set_updated_at();

create or replace function current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select e.id
  from employees e
  where e.auth_user_id = auth.uid()
    and e.is_active = true
  limit 1;
$$;

create or replace function current_employee_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select e.role
  from employees e
  where e.auth_user_id = auth.uid()
    and e.is_active = true
  limit 1;
$$;

create or replace function current_employee_department_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select e.department_id
  from employees e
  where e.auth_user_id = auth.uid()
    and e.is_active = true
  limit 1;
$$;

create table if not exists permission_overrides (
  id                    uuid primary key default gen_random_uuid(),
  employee_id           uuid not null references employees(id) on delete cascade,
  permission            text not null,
  effect                text not null check (effect in ('GRANT','DENY')),
  granted_by            uuid references employees(id),
  created_at            timestamptz not null default now(),
  unique(employee_id, permission)
);

-- =====================================================================
-- 4. SERVICES
-- =====================================================================

create table if not exists services (
  id                   uuid primary key default gen_random_uuid(),
  code                 text not null unique,
  name                 text not null,
  description          text,
  provider_name        text,
  provider_level       text
                       check (provider_level in (
                         'CENTRAL','STATE','DISTRICT','LOCAL','OTHER'
                       )),
  version              integer not null default 1 check (version > 0),
  is_active            boolean not null default true,
  created_at           timestamptz not null default now()
);

-- Reconcile V1 services table
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'services' and column_name = 'code') then
    alter table services add column code text;
    update services set code = 'SCHOLARSHIP_01' where code is null;
    alter table services alter column code set not null;
    alter table services add constraint services_code_key unique (code);
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'services' and column_name = 'provider_name') then
    alter table services add column provider_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'services' and column_name = 'provider_level') then
    alter table services add column provider_level text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'services' and column_name = 'version') then
    alter table services add column version integer not null default 1;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'services' and column_name = 'official_url') then
    alter table services alter column official_url drop not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'services' and column_name = 'official_domain') then
    alter table services alter column official_domain drop not null;
  end if;
end $$;

-- Service-specific requirements make FORMly a platform rather than
-- a PAN-only application.
create table if not exists service_requirements (
  id                   uuid primary key default gen_random_uuid(),
  service_id           uuid not null references services(id) on delete cascade,
  requirement_key      text not null,
  requirement_type     text not null
                       check (requirement_type in (
                         'PROFILE_FIELD',
                         'DOCUMENT',
                         'CONSENT_SCOPE',
                         'VERIFICATION',
                         'ELIGIBILITY'
                       )),
  label                text not null,
  field_key            text,
  document_type        text,
  required             boolean not null default true,
  validation_rule      jsonb not null default '{}'::jsonb,
  order_index          integer not null default 0,
  created_at           timestamptz not null default now(),
  unique(service_id, requirement_key)
);

-- Reconcile service_requirements from V1 if existing
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'service_requirements') then
    alter table service_requirements drop constraint if exists service_requirements_requirement_type_check;

    update service_requirements
    set requirement_type = case
      when requirement_type = 'PERSONAL_INFORMATION' then 'PROFILE_FIELD'
      when requirement_type = 'DECLARATION' then 'ELIGIBILITY'
      else 'DOCUMENT'
    end
    where requirement_type not in ('PROFILE_FIELD','DOCUMENT','CONSENT_SCOPE','VERIFICATION','ELIGIBILITY');

    alter table service_requirements add constraint service_requirements_requirement_type_check
      check (requirement_type in ('PROFILE_FIELD','DOCUMENT','CONSENT_SCOPE','VERIFICATION','ELIGIBILITY'));

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'service_requirements' and column_name = 'requirement_key') then
      alter table service_requirements add column requirement_key text;
      update service_requirements set requirement_key = coalesce('REQ_' || upper(coalesce(field_name, notes)), 'REQ_' || substr(id::text, 1, 8)) where requirement_key is null;
      alter table service_requirements alter column requirement_key set not null;
    end if;

    if not exists (select 1 from pg_constraint where conname = 'service_requirements_service_id_requirement_key_key') then
      alter table service_requirements add constraint service_requirements_service_id_requirement_key_key unique (service_id, requirement_key);
    end if;

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'service_requirements' and column_name = 'field_key') then
      alter table service_requirements add column field_key text;
      if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'service_requirements' and column_name = 'field_name') then
        update service_requirements set field_key = field_name where field_key is null;
      end if;
    end if;

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'service_requirements' and column_name = 'document_type') then
      alter table service_requirements add column document_type text;
      if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'service_requirements' and column_name = 'notes') then
        update service_requirements set document_type = notes where document_type is null;
      end if;
    end if;

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'service_requirements' and column_name = 'order_index') then
      alter table service_requirements add column order_index integer not null default 0;
      if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'service_requirements' and column_name = 'display_order') then
        update service_requirements set order_index = display_order;
      end if;
    end if;

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'service_requirements' and column_name = 'validation_rule') then
      alter table service_requirements add column validation_rule jsonb not null default '{}'::jsonb;
    end if;
  end if;
end $$;

create index if not exists idx_service_requirements_service
on service_requirements(service_id, order_index);

-- =====================================================================
-- 5. SHARED APPLICATION
-- =====================================================================

create table if not exists applications (
  id                        uuid primary key default gen_random_uuid(),
  application_number        text not null unique,
  citizen_user_id           uuid not null references auth.users(id) on delete restrict,
  service_id                uuid not null references services(id) on delete restrict,

  status                    text not null default 'DRAFT'
                            check (status in (
                              'DRAFT',
                              'SUBMITTED',
                              'VALIDATING',
                              'CONSENT_REQUIRED',
                              'CONSENT_VERIFIED',
                              'VERIFICATION_IN_PROGRESS',
                              'VERIFIED',
                              'GOVERNMENT_PROCESSING',
                              'DEPARTMENT_ASSIGNED',
                              'OFFICE_ASSIGNED',
                              'OFFICER_ASSIGNED',
                              'OFFICER_REVIEW',
                              'RETURNED_FOR_CORRECTION',
                              'REVALIDATION',
                              'APPROVED',
                              'REJECTED',
                              'PAN_GENERATION',
                              'PAN_GENERATED',
                              'COMPLETED',
                              'CANCELLED',
                              'VERIFICATION_FAILED',
                              'CONFLICT_DETECTED',
                              'MANUAL_REVIEW',
                              'API_UNAVAILABLE',
                              'RETRY_PENDING',
                              'SYSTEM_ERROR'
                            )),

  priority                  text not null default 'NORMAL'
                            check (priority in (
                              'CRITICAL','HIGH','NORMAL','LOW'
                            )),

  department_id             uuid references departments(id),
  office_id                 uuid references offices(id),
  assigned_employee_id      uuid references employees(id),

  submission_profile_version integer not null default 1,
  submitted_at              timestamptz,
  completed_at              timestamptz,
  cancelled_at              timestamptz,
  sla_due_at                timestamptz,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  check (
    assigned_employee_id is null
    or (department_id is not null)
  )
);

create index if not exists idx_applications_status
on applications(status);

create index if not exists idx_applications_citizen
on applications(citizen_user_id);

create index if not exists idx_applications_service
on applications(service_id);

create index if not exists idx_applications_department_status
on applications(department_id,status);

create index if not exists idx_applications_assignee_status
on applications(assigned_employee_id,status);

create index if not exists idx_applications_priority_status
on applications(priority,status);

drop trigger if exists applications_set_updated_at on applications;
create trigger applications_set_updated_at
before update on applications
for each row execute function set_updated_at();

-- Exact snapshot of citizen information at submission time.
create table if not exists application_profile_snapshots (
  id                    uuid primary key default gen_random_uuid(),
  application_id        uuid not null unique
                        references applications(id) on delete restrict,
  profile_version       integer not null,
  snapshot_data         jsonb not null,
  captured_at           timestamptz not null default now()
);

-- Documents are referenced, not physically duplicated.
create table if not exists application_documents (
  id                    uuid primary key default gen_random_uuid(),
  application_id        uuid not null
                        references applications(id) on delete restrict,
  document_id           uuid not null
                        references documents(id) on delete restrict,
  requirement_id        uuid
                        references service_requirements(id) on delete restrict,
  verification_status   text not null default 'PENDING'
                        check (verification_status in (
                          'PENDING','VERIFIED','NOT_VERIFIED','FAILED',
                          'CONFLICT','MANUAL_REVIEW'
                        )),
  created_at            timestamptz not null default now(),
  unique(application_id, document_id, requirement_id)
);

create index if not exists idx_application_documents_application
on application_documents(application_id);

-- =====================================================================
-- 6. APPLICATION REQUIREMENT STATE
-- =====================================================================

create table if not exists application_requirement_status (
  id                    uuid primary key default gen_random_uuid(),
  application_id        uuid not null
                        references applications(id) on delete cascade,
  requirement_id        uuid not null
                        references service_requirements(id) on delete cascade,
  status                text not null default 'MISSING'
                        check (status in (
                          'MISSING','PRESENT','VALID','INVALID',
                          'CONFLICT','MANUAL_REVIEW','WAIVED'
                        )),
  evidence_ref          jsonb,
  resolved_by           uuid references employees(id),
  resolved_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique(application_id, requirement_id)
);

create index if not exists idx_application_requirement_status_application
on application_requirement_status(application_id,status);

drop trigger if exists application_requirement_status_set_updated_at on application_requirement_status;
create trigger application_requirement_status_set_updated_at
before update on application_requirement_status
for each row execute function set_updated_at();

-- =====================================================================
-- 7. CONSENT
-- =====================================================================

create table if not exists consent_requests (
  id                      uuid primary key default gen_random_uuid(),
  application_id          uuid not null
                          references applications(id) on delete restrict,
  citizen_user_id         uuid not null references auth.users(id),
  requesting_department_id uuid references departments(id),
  recipient_connector_id  uuid,
  purpose                 text not null,
  consent_version         integer not null default 1,
  status                  text not null default 'PENDING'
                          check (status in (
                            'PENDING','GRANTED','DENIED','EXPIRED','REVOKED'
                          )),
  granted_at              timestamptz,
  expires_at              timestamptz,
  revoked_at              timestamptz,
  created_at              timestamptz not null default now()
);

create index if not exists idx_consent_requests_application
on consent_requests(application_id);

create index if not exists idx_consent_requests_citizen
on consent_requests(citizen_user_id);

create table if not exists consent_scopes (
  id                    uuid primary key default gen_random_uuid(),
  consent_request_id    uuid not null
                        references consent_requests(id) on delete cascade,
  data_attribute        text not null,
  purpose               text not null,
  created_at            timestamptz not null default now(),
  unique(consent_request_id,data_attribute)
);

-- =====================================================================
-- 8. CANONICAL DATA / DATA MAPPING
-- =====================================================================

create table if not exists canonical_fields (
  id                    uuid primary key default gen_random_uuid(),
  field_key             text not null unique,
  label                 text not null,
  data_type             text not null
                        check (data_type in (
                          'TEXT','DATE','NUMBER','BOOLEAN','JSON'
                        )),
  sensitive             boolean not null default false,
  created_at            timestamptz not null default now()
);

create table if not exists canonical_values (
  id                    uuid primary key default gen_random_uuid(),
  application_id        uuid not null
                        references applications(id) on delete cascade,
  canonical_field_id    uuid not null
                        references canonical_fields(id),
  value                 text,
  source_type           text not null,
  source_reference      text,
  verification_level    text not null default 'UNVERIFIED'
                        check (verification_level in (
                          'UNVERIFIED',
                          'SELF_DECLARED',
                          'DOCUMENT',
                          'GOVERNMENT_VERIFIED',
                          'HUMAN_VERIFIED'
                        )),
  captured_at           timestamptz not null default now()
);

create index if not exists idx_canonical_values_application_field
on canonical_values(application_id,canonical_field_id);

-- Defined before data_mappings foreign key
create table if not exists connectors (
  id                    uuid primary key default gen_random_uuid(),
  code                  text not null unique,
  name                  text not null,
  environment           text not null default 'DEMO'
                        check (environment in ('DEMO','SANDBOX','PRODUCTION')),
  connector_type        text not null
                        check (connector_type in (
                          'IDENTITY',
                          'DOCUMENT',
                          'PAN_PROCESSING',
                          'PRINTING',
                          'DISPATCH',
                          'DELIVERY',
                          'OTHER'
                        )),
  protocol              text not null default 'REST_JSON'
                        check (protocol in (
                          'REST_JSON','SOAP','LEGACY_FILE','WEBHOOK','OTHER'
                        )),
  base_url              text,
  secret_ref            text,
  enabled               boolean not null default true,
  health_status         text not null default 'UNKNOWN'
                        check (health_status in (
                          'UNKNOWN','HEALTHY','DEGRADED','DOWN'
                        )),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists connectors_set_updated_at on connectors;
create trigger connectors_set_updated_at
before update on connectors
for each row execute function set_updated_at();

create table if not exists data_mappings (
  id                    uuid primary key default gen_random_uuid(),
  connector_id          uuid references connectors(id) on delete cascade,
  external_field_name   text not null,
  canonical_field_id    uuid not null references canonical_fields(id),
  transform_rule        jsonb not null default '{}'::jsonb,
  version               integer not null default 1,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  unique(connector_id,external_field_name,version)
);

-- =====================================================================
-- 9. CONNECTORS / INTEROPERABILITY
-- =====================================================================

-- Operational record for outbound calls.
-- IMPORTANT: keep sensitive request/response bodies outside this table
-- unless there is a documented retention + encryption policy.
create table if not exists connector_requests (
  id                    uuid primary key default gen_random_uuid(),
  connector_id          uuid not null references connectors(id),
  application_id        uuid references applications(id) on delete restrict,
  request_id            text not null unique,
  correlation_id        uuid,
  idempotency_key       text not null,
  operation             text not null,
  request_metadata      jsonb not null default '{}'::jsonb,
  response_metadata     jsonb not null default '{}'::jsonb,
  status                text not null default 'PENDING'
                        check (status in (
                          'PENDING','SUCCESS','FAILED','TIMEOUT',
                          'RETRYING','CANCELLED'
                        )),
  retry_count           integer not null default 0,
  max_retries           integer not null default 3,
  next_retry_at         timestamptz,
  latency_ms            integer,
  error_code            text,
  error_message         text,
  started_at            timestamptz,
  completed_at          timestamptz,
  created_at            timestamptz not null default now(),
  unique(connector_id,idempotency_key)
);

create index if not exists idx_connector_requests_application
on connector_requests(application_id);

create index if not exists idx_connector_requests_connector_status
on connector_requests(connector_id,status);

create index if not exists idx_connector_requests_correlation
on connector_requests(correlation_id);

-- =====================================================================
-- 10. VERIFICATION
-- =====================================================================

create table if not exists verification_requests (
  id                    uuid primary key default gen_random_uuid(),
  application_id        uuid not null
                        references applications(id) on delete restrict,
  verification_type     text not null
                        check (verification_type in (
                          'IDENTITY',
                          'DOCUMENT',
                          'CROSS_SYSTEM',
                          'DUPLICATE_CHECK',
                          'ELIGIBILITY'
                        )),
  connector_id          uuid references connectors(id),
  status                text not null default 'PENDING'
                        check (status in (
                          'PENDING','RUNNING','VERIFIED','NOT_VERIFIED',
                          'FAILED','CONFLICT','MANUAL_REVIEW'
                        )),
  idempotency_key       text not null unique,
  requested_at          timestamptz not null default now(),
  completed_at          timestamptz
);

create index if not exists idx_verification_requests_application
on verification_requests(application_id);

create table if not exists verification_results (
  id                    uuid primary key default gen_random_uuid(),
  verification_request_id uuid not null
                          references verification_requests(id) on delete cascade,
  result                text not null
                        check (result in (
                          'VERIFIED','NOT_VERIFIED','PENDING',
                          'FAILED','CONFLICT','MANUAL_REVIEW'
                        )),
  source_name           text,
  confidence            numeric(4,3)
                        check (confidence is null or confidence between 0 and 1),
  details               jsonb not null default '{}'::jsonb,
  conflict_fields       text[],
  created_at            timestamptz not null default now()
);

create index if not exists idx_verification_results_request
on verification_results(verification_request_id);

-- =====================================================================
-- 11. ROUTING / ASSIGNMENT
-- =====================================================================

create table if not exists routing_rules (
  id                    uuid primary key default gen_random_uuid(),
  service_id            uuid not null
                        references services(id) on delete cascade,
  department_id         uuid references departments(id),
  office_id             uuid references offices(id),
  target_role           text not null
                        check (target_role in (
                          'DEPARTMENT_OFFICER',
                          'DEPARTMENT_ADMIN'
                        )),
  conditions            jsonb not null default '{}'::jsonb,
  priority_order        integer not null default 1,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);

create index if not exists idx_routing_rules_service
on routing_rules(service_id,priority_order);

create table if not exists application_assignments (
  id                    uuid primary key default gen_random_uuid(),
  application_id        uuid not null
                        references applications(id) on delete restrict,
  department_id         uuid references departments(id),
  office_id             uuid references offices(id),
  employee_id           uuid references employees(id),
  assignment_type       text not null
                        check (assignment_type in (
                          'AUTO_ROUTED',
                          'MANUAL',
                          'REASSIGNED',
                          'WORKLOAD_REBALANCE'
                        )),
  reason                text,
  assigned_by           uuid references employees(id),
  assigned_at           timestamptz not null default now(),
  released_at           timestamptz
);

create index if not exists idx_application_assignments_application
on application_assignments(application_id);

create index if not exists idx_application_assignments_employee
on application_assignments(employee_id);

-- =====================================================================
-- 12. WORKFLOW ENGINE
-- =====================================================================

create table if not exists workflow_definitions (
  id                    uuid primary key default gen_random_uuid(),
  service_id            uuid not null
                        references services(id) on delete cascade,
  code                  text not null,
  version               integer not null default 1 check (version > 0),
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  unique(service_id,code,version)
);

create table if not exists workflow_steps (
  id                    uuid primary key default gen_random_uuid(),
  workflow_definition_id uuid not null
                        references workflow_definitions(id) on delete cascade,
  step_key              text not null,
  label                 text not null,
  step_type             text not null
                        check (step_type in (
                          'AUTOMATED','HUMAN','WAIT','END'
                        )),
  requires_human        boolean not null default false,
  connector_id          uuid references connectors(id),
  timeout_minutes       integer check (timeout_minutes is null or timeout_minutes > 0),
  retry_policy          jsonb not null default '{}'::jsonb,
  config                jsonb not null default '{}'::jsonb,
  order_hint            integer not null default 0,
  unique(workflow_definition_id,step_key)
);

create table if not exists workflow_transitions (
  id                    uuid primary key default gen_random_uuid(),
  workflow_definition_id uuid not null
                        references workflow_definitions(id) on delete cascade,
  from_step_id          uuid not null references workflow_steps(id) on delete cascade,
  to_step_id            uuid not null references workflow_steps(id) on delete cascade,
  condition             jsonb not null default '{}'::jsonb,
  priority              integer not null default 1,
  is_active             boolean not null default true
);

create index if not exists idx_workflow_transitions_from_step
on workflow_transitions(from_step_id,priority);

create table if not exists workflow_executions (
  id                    uuid primary key default gen_random_uuid(),
  application_id        uuid not null
                        references applications(id) on delete restrict,
  workflow_definition_id uuid not null
                        references workflow_definitions(id),
  status                text not null default 'RUNNING'
                        check (status in (
                          'RUNNING','PAUSED','COMPLETED','FAILED','CANCELLED'
                        )),
  current_step_id       uuid references workflow_steps(id),
  started_at            timestamptz not null default now(),
  completed_at          timestamptz,
  last_error            text
);

create unique index if not exists uq_running_workflow_per_application
on workflow_executions(application_id)
where status in ('RUNNING','PAUSED');

create table if not exists workflow_step_executions (
  id                    uuid primary key default gen_random_uuid(),
  workflow_execution_id uuid not null
                        references workflow_executions(id) on delete cascade,
  workflow_step_id      uuid not null references workflow_steps(id),
  attempt               integer not null default 1 check (attempt > 0),
  status                text not null default 'PENDING'
                        check (status in (
                          'PENDING','IN_PROGRESS','COMPLETED',
                          'FAILED','SKIPPED','WAITING'
                        )),
  input_metadata        jsonb not null default '{}'::jsonb,
  output_metadata       jsonb not null default '{}'::jsonb,
  error_code            text,
  error_message         text,
  started_at            timestamptz,
  completed_at          timestamptz
);

create index if not exists idx_workflow_step_executions_workflow
on workflow_step_executions(workflow_execution_id);

-- =====================================================================
-- 13. SERVICE-SPECIFIC HUMAN REVIEW POLICY
-- =====================================================================

create table if not exists service_decision_policies (
  id                    uuid primary key default gen_random_uuid(),
  service_id            uuid not null
                        references services(id) on delete cascade,
  review_mode           text not null
                        check (review_mode in (
                          'AUTOMATED_WHERE_ALLOWED',
                          'MANDATORY_HUMAN',
                          'HUMAN_ON_EXCEPTION'
                        )),
  allow_officer_return  boolean not null default true,
  allow_officer_reject  boolean not null default true,
  created_at            timestamptz not null default now(),
  unique(service_id)
);

-- =====================================================================
-- 14. OFFICER DECISIONS + CORRECTION REQUESTS
-- =====================================================================

-- This is the OFFICIAL decision record.
-- AI explanations are stored separately and never replace reason_text.
create table if not exists application_decisions (
  id                    uuid primary key default gen_random_uuid(),
  application_id        uuid not null
                        references applications(id) on delete restrict,
  employee_id           uuid not null references employees(id),
  decision              text not null
                        check (decision in (
                          'APPROVED',
                          'REJECTED',
                          'RETURNED_FOR_CORRECTION'
                        )),
  reason_code           text,
  reason_text           text not null,
  affected_field        text,
  affected_requirement_id uuid
                        references service_requirements(id),
  evidence              jsonb not null default '{}'::jsonb,
  correction_possible   boolean,
  created_at            timestamptz not null default now()
);

create index if not exists idx_application_decisions_application
on application_decisions(application_id,created_at);

create table if not exists correction_requests (
  id                    uuid primary key default gen_random_uuid(),
  application_id        uuid not null
                        references applications(id) on delete restrict,
  decision_id           uuid not null
                        references application_decisions(id) on delete restrict,

  issue_code            text not null,
  issue_description     text not null,
  required_action       text,
  affected_field        text,
  affected_document_id  uuid references documents(id) on delete restrict,

  citizen_response      text,
  status                text not null default 'OPEN'
                        check (status in (
                          'OPEN',
                          'IN_PROGRESS',
                          'SUBMITTED',
                          'VALIDATING',
                          'RESOLVED',
                          'CLOSED'
                        )),

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  resolved_at           timestamptz
);

create index if not exists idx_correction_requests_application_status
on correction_requests(application_id,status);

drop trigger if exists correction_requests_set_updated_at on correction_requests;
create trigger correction_requests_set_updated_at
before update on correction_requests
for each row execute function set_updated_at();

-- =====================================================================
-- 15. AI ASSISTANCE
-- =====================================================================

-- AI reads the official decision/correction and produces a citizen-friendly
-- explanation or suggested next steps. It cannot mutate application status.
create table if not exists ai_case_assistance (
  id                    uuid primary key default gen_random_uuid(),
  application_id        uuid not null
                        references applications(id) on delete restrict,
  decision_id           uuid references application_decisions(id) on delete restrict,
  correction_request_id uuid references correction_requests(id) on delete restrict,

  assistance_type       text not null
                        check (assistance_type in (
                          'RETURN_EXPLANATION',
                          'REJECTION_EXPLANATION',
                          'CORRECTION_GUIDANCE',
                          'CASE_SUMMARY',
                          'CONFLICT_EXPLANATION'
                        )),

  source_reason         text not null,
  explanation           text not null,
  recommended_actions   jsonb not null default '[]'::jsonb,

  model_name            text,
  prompt_version        text,
  generated_at          timestamptz not null default now(),
  created_at            timestamptz not null default now(),

  -- Only approved/curated output should be exposed to a citizen UI.
  review_status         text not null default 'PENDING'
                        check (review_status in (
                          'PENDING','APPROVED_FOR_DISPLAY',
                          'REJECTED','SUPERSEDED'
                        )),
  reviewed_by           uuid references employees(id),
  reviewed_at           timestamptz
);

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'ai_case_assistance') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ai_case_assistance' and column_name = 'created_at') then
      alter table ai_case_assistance add column created_at timestamptz not null default now();
    end if;
  end if;
end $$;

create index if not exists idx_ai_case_assistance_application
on ai_case_assistance(application_id,created_at);

-- =====================================================================
-- 16. STATE HISTORY
-- =====================================================================

create table if not exists application_state_history (
  id                    uuid primary key default gen_random_uuid(),
  application_id        uuid not null
                        references applications(id) on delete restrict,
  from_status           text,
  to_status             text not null,
  actor_type            text not null
                        check (actor_type in (
                          'CITIZEN','EMPLOYEE','SYSTEM','AI'
                        )),
  actor_id              uuid,
  reason                text,
  created_at            timestamptz not null default now(),
  -- Product Rule 1: AI cannot approve or reject
  check (
    not (actor_type = 'AI' and to_status in ('APPROVED', 'REJECTED'))
  )
);

create index if not exists idx_application_state_history_application
on application_state_history(application_id,created_at);

-- =====================================================================
-- 17. DOMAIN EVENTS
-- =====================================================================

create table if not exists domain_events (
  id                    uuid primary key default gen_random_uuid(),
  application_id        uuid references applications(id) on delete restrict,

  event_type            text not null,
  actor_type            text not null
                        check (actor_type in (
                          'CITIZEN','EMPLOYEE','SYSTEM','AI'
                        )),
  actor_id              uuid,
  correlation_id        uuid,
  payload               jsonb not null default '{}'::jsonb,

  occurred_at           timestamptz not null default now(),
  processed_at          timestamptz
);

create index if not exists idx_domain_events_application
on domain_events(application_id,occurred_at);

create index if not exists idx_domain_events_type
on domain_events(event_type,occurred_at);

-- =====================================================================
-- 18. EXCEPTIONS
-- =====================================================================

create table if not exists exceptions (
  id                    uuid primary key default gen_random_uuid(),
  application_id        uuid not null
                        references applications(id) on delete restrict,
  exception_type        text not null
                        check (exception_type in (
                          'API_FAILURE',
                          'DATA_CONFLICT',
                          'MANUAL_REVIEW',
                          'VERIFICATION_FAILURE',
                          'DELAYED',
                          'RETRY_FAILURE',
                          'SYSTEM_ERROR',
                          'UNAUTHORIZED_REQUEST'
                        )),
  source_connector_id   uuid references connectors(id),
  description           text not null,
  severity              text not null default 'MEDIUM'
                        check (severity in (
                          'LOW','MEDIUM','HIGH','CRITICAL'
                        )),
  required_action       text,
  assigned_employee_id  uuid references employees(id),

  retry_status          text not null default 'NOT_APPLICABLE'
                        check (retry_status in (
                          'NOT_APPLICABLE','PENDING','RETRYING','EXHAUSTED'
                        )),

  resolved              boolean not null default false,
  resolved_by           uuid references employees(id),
  resolved_at           timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists idx_exceptions_unresolved
on exceptions(resolved,severity,created_at);

create index if not exists idx_exceptions_application
on exceptions(application_id);

-- =====================================================================
-- 19. AUDIT — APPEND-ONLY DATA MODEL
-- =====================================================================

create table if not exists audit_events (
  id                    uuid primary key default gen_random_uuid(),
  actor_type            text not null
                        check (actor_type in (
                          'CITIZEN','EMPLOYEE','SYSTEM','AI'
                        )),
  actor_id              uuid,
  action                text not null,
  application_id        uuid references applications(id) on delete restrict,

  source                text,
  target                text,
  purpose               text,
  consent_id            uuid references consent_requests(id),

  request_id            text,
  result                text,

  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists idx_audit_events_application
on audit_events(application_id,created_at);

create index if not exists idx_audit_events_actor
on audit_events(actor_type,actor_id,created_at);

-- Product Rule 19: Strict immutable append-only enforcement
create or replace function prevent_audit_events_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Product Rule 19 violation: audit_events is strictly append-only; update/delete prohibited';
end;
$$;

drop trigger if exists trg_audit_events_immutable on audit_events;
create trigger trg_audit_events_immutable
before update or delete on audit_events
for each row execute function prevent_audit_events_mutation();

-- Controlled append-only helper function
create or replace function record_audit_event(
  p_actor_type text,
  p_actor_id uuid,
  p_action text,
  p_application_id uuid default null,
  p_source text default null,
  p_target text default null,
  p_purpose text default null,
  p_consent_id uuid default null,
  p_request_id text default null,
  p_result text default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into audit_events (
    actor_type, actor_id, action, application_id,
    source, target, purpose, consent_id,
    request_id, result, metadata
  ) values (
    p_actor_type, p_actor_id, p_action, p_application_id,
    p_source, p_target, p_purpose, p_consent_id,
    p_request_id, p_result, coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_id;

  return v_id;
end;
$$;

-- =====================================================================
-- 20. NOTIFICATIONS
-- =====================================================================

create table if not exists notifications (
  id                    uuid primary key default gen_random_uuid(),
  application_id        uuid references applications(id) on delete restrict,
  recipient_type        text not null
                        check (recipient_type in ('CITIZEN','EMPLOYEE')),
  recipient_id          uuid not null,
  notification_type     text not null,
  title                 text not null,
  body                  text,
  severity              text not null default 'INFO'
                        check (severity in (
                          'INFO','ACTION_REQUIRED','WARNING','SUCCESS','ERROR'
                        )),
  action_url            text,
  read_at               timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists idx_notifications_recipient
on notifications(recipient_type,recipient_id,read_at,created_at);

-- =====================================================================
-- 21. OPTIONAL PHYSICAL CARD PROCESS
-- =====================================================================

create table if not exists physical_card_requests (
  id                         uuid primary key default gen_random_uuid(),
  application_id             uuid not null
                             references applications(id) on delete restrict,

  request_source             text not null default 'CITIZEN'
                             check (request_source in (
                               'CITIZEN','EMPLOYEE','SYSTEM'
                             )),

  stage                      text not null default 'REQUESTED'
                             check (stage in (
                               'REQUESTED',
                               'ACCEPTED',
                               'PRINTING',
                               'PRINTED',
                               'DISPATCHED',
                               'DELIVERED',
                               'FAILED',
                               'CANCELLED'
                             )),

  print_connector_request_id  uuid references connector_requests(id),
  dispatch_connector_request_id uuid references connector_requests(id),
  delivery_connector_request_id uuid references connector_requests(id),

  tracking_number            text,
  requested_at               timestamptz not null default now(),
  dispatched_at              timestamptz,
  delivered_at               timestamptz,

  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index if not exists idx_physical_card_requests_application
on physical_card_requests(application_id);

drop trigger if exists physical_card_requests_set_updated_at on physical_card_requests;
create trigger physical_card_requests_set_updated_at
before update on physical_card_requests
for each row execute function set_updated_at();

-- =====================================================================
-- 22. IDEMPOTENCY
-- =====================================================================

create table if not exists idempotency_keys (
  key                    text primary key,
  operation              text not null,
  application_id         uuid references applications(id) on delete restrict,
  response_snapshot      jsonb,
  created_at             timestamptz not null default now()
);

-- =====================================================================
-- 23. SLA
-- =====================================================================

create table if not exists service_sla_policies (
  id                         uuid primary key default gen_random_uuid(),
  service_id                 uuid not null
                             references services(id) on delete cascade,
  workflow_step_id           uuid references workflow_steps(id) on delete cascade,
  target_minutes             integer not null check (target_minutes > 0),
  escalation_after_minutes   integer
                             check (
                               escalation_after_minutes is null
                               or escalation_after_minutes > 0
                             ),
  is_active                  boolean not null default true,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

drop trigger if exists service_sla_policies_set_updated_at on service_sla_policies;
create trigger service_sla_policies_set_updated_at
before update on service_sla_policies
for each row execute function set_updated_at();

-- =====================================================================
-- 24. STATE MACHINE TRANSITION ENGINE (Product Rules 1, 4, 5)
-- =====================================================================

create or replace function transition_application_status(
  p_application_id uuid,
  p_to_status text,
  p_actor_type text,
  p_actor_id uuid,
  p_reason text default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_status text;
  v_valid_transition boolean := false;
begin
  -- Product Rule 1: AI cannot approve or reject
  if p_actor_type = 'AI' and p_to_status in ('APPROVED', 'REJECTED') then
    raise exception 'Product Rule 1 violation: AI cannot APPROVE or REJECT an application';
  end if;

  select status into v_current_status
  from applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application % not found', p_application_id;
  end if;

  if v_current_status = p_to_status then
    return v_current_status;
  end if;

  -- Product Rule 5: Explicit transition matrix; arbitrary jumps blocked
  case v_current_status
    when 'DRAFT' then
      v_valid_transition := p_to_status in ('SUBMITTED', 'CANCELLED');
    when 'SUBMITTED' then
      v_valid_transition := p_to_status in ('VALIDATING', 'CANCELLED');
    when 'VALIDATING' then
      v_valid_transition := p_to_status in ('CONSENT_REQUIRED', 'CONSENT_VERIFIED', 'VERIFICATION_IN_PROGRESS', 'MANUAL_REVIEW', 'SYSTEM_ERROR', 'CANCELLED');
    when 'CONSENT_REQUIRED' then
      v_valid_transition := p_to_status in ('CONSENT_VERIFIED', 'CANCELLED');
    when 'CONSENT_VERIFIED' then
      v_valid_transition := p_to_status in ('VERIFICATION_IN_PROGRESS', 'CANCELLED');
    when 'VERIFICATION_IN_PROGRESS' then
      v_valid_transition := p_to_status in ('VERIFIED', 'VERIFICATION_FAILED', 'CONFLICT_DETECTED', 'MANUAL_REVIEW', 'API_UNAVAILABLE', 'RETRY_PENDING');
    when 'API_UNAVAILABLE' then
      v_valid_transition := p_to_status in ('RETRY_PENDING', 'VERIFICATION_IN_PROGRESS', 'MANUAL_REVIEW');
    when 'RETRY_PENDING' then
      v_valid_transition := p_to_status in ('VERIFICATION_IN_PROGRESS', 'MANUAL_REVIEW', 'SYSTEM_ERROR');
    when 'VERIFIED' then
      v_valid_transition := p_to_status in ('GOVERNMENT_PROCESSING', 'DEPARTMENT_ASSIGNED', 'CONFLICT_DETECTED', 'MANUAL_REVIEW');
    when 'GOVERNMENT_PROCESSING' then
      v_valid_transition := p_to_status in ('DEPARTMENT_ASSIGNED', 'OFFICE_ASSIGNED', 'OFFICER_ASSIGNED', 'OFFICER_REVIEW', 'APPROVED', 'MANUAL_REVIEW');
    when 'DEPARTMENT_ASSIGNED' then
      v_valid_transition := p_to_status in ('OFFICE_ASSIGNED', 'OFFICER_ASSIGNED', 'OFFICER_REVIEW');
    when 'OFFICE_ASSIGNED' then
      v_valid_transition := p_to_status in ('OFFICER_ASSIGNED', 'OFFICER_REVIEW');
    when 'OFFICER_ASSIGNED' then
      v_valid_transition := p_to_status in ('OFFICER_REVIEW');
    when 'OFFICER_REVIEW' then
      v_valid_transition := p_to_status in ('APPROVED', 'REJECTED', 'RETURNED_FOR_CORRECTION', 'OFFICER_ASSIGNED');
    when 'RETURNED_FOR_CORRECTION' then
      v_valid_transition := p_to_status in ('REVALIDATION', 'SUBMITTED', 'CANCELLED');
    when 'REVALIDATION' then
      v_valid_transition := p_to_status in ('VERIFICATION_IN_PROGRESS', 'OFFICER_REVIEW', 'GOVERNMENT_PROCESSING');
    when 'APPROVED' then
      v_valid_transition := p_to_status in ('PAN_GENERATION', 'COMPLETED');
    when 'PAN_GENERATION' then
      v_valid_transition := p_to_status in ('PAN_GENERATED', 'SYSTEM_ERROR');
    when 'PAN_GENERATED' then
      v_valid_transition := p_to_status in ('COMPLETED');
    when 'CONFLICT_DETECTED' then
      v_valid_transition := p_to_status in ('MANUAL_REVIEW', 'OFFICER_REVIEW', 'REJECTED', 'RETURNED_FOR_CORRECTION');
    when 'MANUAL_REVIEW' then
      v_valid_transition := p_to_status in ('DEPARTMENT_ASSIGNED', 'OFFICER_ASSIGNED', 'OFFICER_REVIEW', 'REJECTED', 'RETURNED_FOR_CORRECTION');
    when 'VERIFICATION_FAILED' then
      v_valid_transition := p_to_status in ('REJECTED', 'MANUAL_REVIEW', 'RETURNED_FOR_CORRECTION');
    when 'SYSTEM_ERROR' then
      v_valid_transition := p_to_status in ('RETRY_PENDING', 'MANUAL_REVIEW', 'CANCELLED');
    else
      v_valid_transition := false;
  end case;

  if not v_valid_transition then
    raise exception 'Product Rule 5 violation: Invalid status jump from % to % for application %',
      v_current_status, p_to_status, p_application_id;
  end if;

  -- Apply status update and timestamp tracking
  update applications
  set status = p_to_status,
      submitted_at = case when p_to_status = 'SUBMITTED' and submitted_at is null then now() else submitted_at end,
      completed_at = case when p_to_status = 'COMPLETED' and completed_at is null then now() else completed_at end,
      cancelled_at = case when p_to_status = 'CANCELLED' and cancelled_at is null then now() else cancelled_at end,
      updated_at = now()
  where id = p_application_id;

  -- Product Rule 4: Record every state transition with actor
  insert into application_state_history (
    application_id, from_status, to_status, actor_type, actor_id, reason
  ) values (
    p_application_id, v_current_status, p_to_status, p_actor_type, p_actor_id, p_reason
  );

  -- Record domain event
  insert into domain_events (
    application_id, event_type, actor_type, actor_id, payload
  ) values (
    p_application_id,
    'APPLICATION_STATUS_' || p_to_status,
    p_actor_type,
    p_actor_id,
    jsonb_build_object(
      'from_status', v_current_status,
      'to_status', p_to_status,
      'reason', p_reason
    )
  );

  return p_to_status;
end;
$$;

-- =====================================================================
-- 25. PERMISSION-SCOPED VIEWS (Product Rule 10)
-- Citizen UI never receives government-only data directly.
-- =====================================================================

create or replace view citizen_applications_view as
select
  a.id,
  a.application_number,
  a.citizen_user_id,
  a.service_id,
  s.name as service_name,
  s.code as service_code,
  a.status,
  a.priority,
  a.submitted_at,
  a.completed_at,
  a.sla_due_at,
  a.created_at,
  a.updated_at
from applications a
join services s on s.id = a.service_id;

create or replace view government_applications_view as
select
  a.id,
  a.application_number,
  a.citizen_user_id,
  a.service_id,
  s.name as service_name,
  s.code as service_code,
  a.status,
  a.priority,
  a.department_id,
  d.name as department_name,
  a.office_id,
  o.name as office_name,
  a.assigned_employee_id,
  e.full_name as assigned_officer_name,
  e.employee_code as assigned_officer_code,
  a.submission_profile_version,
  a.submitted_at,
  a.completed_at,
  a.sla_due_at,
  (a.sla_due_at is not null and a.sla_due_at < now() and a.status not in ('COMPLETED','REJECTED','CANCELLED')) as is_sla_breached,
  (select count(*) from exceptions x where x.application_id = a.id and x.resolved = false) as open_exceptions_count,
  a.created_at,
  a.updated_at
from applications a
join services s on s.id = a.service_id
left join departments d on d.id = a.department_id
left join offices o on o.id = a.office_id
left join employees e on e.id = a.assigned_employee_id;

create or replace view citizen_timeline_view as
select
  h.id,
  h.application_id,
  h.from_status,
  h.to_status,
  h.actor_type,
  h.created_at,
  case
    when h.to_status = 'RETURNED_FOR_CORRECTION' then h.reason
    when h.to_status = 'REJECTED' then h.reason
    when h.actor_type = 'CITIZEN' then h.reason
    else null
  end as display_message
from application_state_history h;

create or replace view government_timeline_view as
select
  h.id,
  h.application_id,
  h.from_status,
  h.to_status,
  h.actor_type,
  h.actor_id,
  e.full_name as employee_name,
  e.role as employee_role,
  h.reason,
  h.created_at
from application_state_history h
left join employees e on e.id = h.actor_id and h.actor_type = 'EMPLOYEE';

-- =====================================================================
-- 26. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

alter table profiles enable row level security;
alter table profile_fields enable row level security;
alter table documents enable row level security;
alter table extracted_fields enable row level security;
alter table departments enable row level security;
alter table offices enable row level security;
alter table employees enable row level security;
alter table permission_overrides enable row level security;
alter table services enable row level security;
alter table service_requirements enable row level security;
alter table applications enable row level security;
alter table application_profile_snapshots enable row level security;
alter table application_documents enable row level security;
alter table application_requirement_status enable row level security;
alter table consent_requests enable row level security;
alter table consent_scopes enable row level security;
alter table canonical_fields enable row level security;
alter table canonical_values enable row level security;
alter table data_mappings enable row level security;
alter table connectors enable row level security;
alter table connector_requests enable row level security;
alter table verification_requests enable row level security;
alter table verification_results enable row level security;
alter table routing_rules enable row level security;
alter table application_assignments enable row level security;
alter table workflow_definitions enable row level security;
alter table workflow_steps enable row level security;
alter table workflow_transitions enable row level security;
alter table workflow_executions enable row level security;
alter table workflow_step_executions enable row level security;
alter table service_decision_policies enable row level security;
alter table application_decisions enable row level security;
alter table correction_requests enable row level security;
alter table ai_case_assistance enable row level security;
alter table application_state_history enable row level security;
alter table domain_events enable row level security;
alter table exceptions enable row level security;
alter table audit_events enable row level security;
alter table notifications enable row level security;
alter table physical_card_requests enable row level security;
alter table idempotency_keys enable row level security;
alter table service_sla_policies enable row level security;

-- Profiles: citizen manages own; employees can view
drop policy if exists "own profiles" on profiles;
create policy "own profiles" on profiles
  for all using (auth.uid() = user_id or current_employee_id() is not null);

-- Profile fields: citizen manages own; employees can view
drop policy if exists "own profile fields v2" on profile_fields;
create policy "own profile fields v2" on profile_fields
  for all using (auth.uid() = user_id or current_employee_id() is not null);

-- Documents: citizen manages own; employees can view
drop policy if exists "own documents v2" on documents;
create policy "own documents v2" on documents
  for all using (auth.uid() = user_id or current_employee_id() is not null);

-- Extracted fields: accessible if owning document or employee
drop policy if exists "extracted fields v2" on extracted_fields;
create policy "extracted fields v2" on extracted_fields
  for all using (
    exists (select 1 from documents d where d.id = document_id and d.user_id = auth.uid())
    or current_employee_id() is not null
  );

-- Departments & Offices: public read
drop policy if exists "departments read" on departments;
create policy "departments read" on departments for select using (true);

drop policy if exists "offices read" on offices;
create policy "offices read" on offices for select using (true);

-- Employees: visible to authenticated staff, or own employee record
drop policy if exists "employees view" on employees;
create policy "employees view" on employees
  for select using (auth.uid() = auth_user_id or current_employee_id() is not null);

-- Services and Requirements: public read
drop policy if exists "services public read v2" on services;
create policy "services public read v2" on services for select using (true);

drop policy if exists "service_requirements public read v2" on service_requirements;
create policy "service_requirements public read v2" on service_requirements for select using (true);

-- Applications: Citizen reads/creates own; Employees read/manage department applications
drop policy if exists "applications citizen read" on applications;
create policy "applications citizen read" on applications
  for select using (citizen_user_id = auth.uid() or current_employee_id() is not null);

drop policy if exists "applications citizen insert" on applications;
create policy "applications citizen insert" on applications
  for insert with check (citizen_user_id = auth.uid());

drop policy if exists "applications citizen update" on applications;
create policy "applications citizen update" on applications
  for update using (
    (citizen_user_id = auth.uid() and status in ('DRAFT', 'RETURNED_FOR_CORRECTION'))
    or current_employee_id() is not null
  );

-- Snapshots: readable by citizen owner and employees
drop policy if exists "snapshots read" on application_profile_snapshots;
create policy "snapshots read" on application_profile_snapshots
  for select using (
    exists (select 1 from applications a where a.id = application_id and (a.citizen_user_id = auth.uid() or current_employee_id() is not null))
  );

-- Application Documents: readable by citizen owner and employees
drop policy if exists "app documents read" on application_documents;
create policy "app documents read" on application_documents
  for all using (
    exists (select 1 from applications a where a.id = application_id and (a.citizen_user_id = auth.uid() or current_employee_id() is not null))
  );

-- Requirement status: citizen and employees
drop policy if exists "app req status read" on application_requirement_status;
create policy "app req status read" on application_requirement_status
  for all using (
    exists (select 1 from applications a where a.id = application_id and (a.citizen_user_id = auth.uid() or current_employee_id() is not null))
  );

-- Consent requests: citizen reads/grants own; employees read
drop policy if exists "consent requests policy" on consent_requests;
create policy "consent requests policy" on consent_requests
  for all using (citizen_user_id = auth.uid() or current_employee_id() is not null);

drop policy if exists "consent scopes policy" on consent_scopes;
create policy "consent scopes policy" on consent_scopes
  for all using (
    exists (select 1 from consent_requests cr where cr.id = consent_request_id and (cr.citizen_user_id = auth.uid() or current_employee_id() is not null))
  );

-- Decisions: citizen reads; employees manage
drop policy if exists "decisions read" on application_decisions;
create policy "decisions read" on application_decisions
  for select using (
    exists (select 1 from applications a where a.id = application_id and (a.citizen_user_id = auth.uid() or current_employee_id() is not null))
  );

drop policy if exists "decisions employee insert" on application_decisions;
create policy "decisions employee insert" on application_decisions
  for insert with check (current_employee_id() is not null);

-- Correction requests: citizen reads & responds; employees manage
drop policy if exists "corrections citizen read" on correction_requests;
create policy "corrections citizen read" on correction_requests
  for select using (
    exists (select 1 from applications a where a.id = application_id and (a.citizen_user_id = auth.uid() or current_employee_id() is not null))
  );

drop policy if exists "corrections update" on correction_requests;
create policy "corrections update" on correction_requests
  for update using (
    exists (select 1 from applications a where a.id = application_id and (a.citizen_user_id = auth.uid() or current_employee_id() is not null))
  );

-- AI assistance: Citizen can ONLY read approved curated output (Product Rule 1 & 10)
drop policy if exists "ai assistance citizen read" on ai_case_assistance;
create policy "ai assistance citizen read" on ai_case_assistance
  for select using (
    (review_status = 'APPROVED_FOR_DISPLAY' and exists (
      select 1 from applications a where a.id = application_id and a.citizen_user_id = auth.uid()
    ))
    or current_employee_id() is not null
  );

-- State history: Citizen reads own; Employee reads all
drop policy if exists "state history read" on application_state_history;
create policy "state history read" on application_state_history
  for select using (
    exists (select 1 from applications a where a.id = application_id and (a.citizen_user_id = auth.uid() or current_employee_id() is not null))
  );

-- Audit events: Append allowed; read scoped
drop policy if exists "audit events insert" on audit_events;
create policy "audit events insert" on audit_events
  for insert with check (true);

drop policy if exists "audit events read" on audit_events;
create policy "audit events read" on audit_events
  for select using (
    (actor_type = 'CITIZEN' and actor_id = auth.uid())
    or current_employee_id() is not null
  );

-- Notifications: scoped to recipient
drop policy if exists "notifications recipient" on notifications;
create policy "notifications recipient" on notifications
  for all using (
    (recipient_type = 'CITIZEN' and recipient_id = auth.uid())
    or (recipient_type = 'EMPLOYEE' and recipient_id = current_employee_id())
  );

-- Physical card requests: citizen reads/creates own; employee manages
drop policy if exists "physical cards citizen" on physical_card_requests;
create policy "physical cards citizen" on physical_card_requests
  for all using (
    exists (select 1 from applications a where a.id = application_id and (a.citizen_user_id = auth.uid() or current_employee_id() is not null))
  );

-- Government-only operational tables: Employee access only
drop policy if exists "connectors employee only" on connectors;
create policy "connectors employee only" on connectors
  for all using (current_employee_id() is not null);

drop policy if exists "connector requests employee only" on connector_requests;
create policy "connector requests employee only" on connector_requests
  for all using (current_employee_id() is not null);

drop policy if exists "exceptions employee only" on exceptions;
create policy "exceptions employee only" on exceptions
  for all using (current_employee_id() is not null);

drop policy if exists "routing rules employee only" on routing_rules;
create policy "routing rules employee only" on routing_rules
  for all using (current_employee_id() is not null);

drop policy if exists "assignments employee only" on application_assignments;
create policy "assignments employee only" on application_assignments
  for all using (current_employee_id() is not null);

drop policy if exists "workflow defs read" on workflow_definitions;
create policy "workflow defs read" on workflow_definitions
  for select using (true);

drop policy if exists "workflow steps read" on workflow_steps;
create policy "workflow steps read" on workflow_steps
  for select using (true);

drop policy if exists "workflow exec employee only" on workflow_executions;
create policy "workflow exec employee only" on workflow_executions
  for all using (current_employee_id() is not null);

drop policy if exists "sla policies read" on service_sla_policies;
create policy "sla policies read" on service_sla_policies
  for select using (true);

drop policy if exists "sla policies staff manage" on service_sla_policies;
create policy "sla policies staff manage" on service_sla_policies
  for all using (current_employee_role() in ('SYSTEM_ADMIN', 'DEPARTMENT_ADMIN'));

-- Permission Overrides: Staff access
drop policy if exists "permission_overrides staff" on permission_overrides;
create policy "permission_overrides staff" on permission_overrides
  for all using (current_employee_id() is not null);

-- Canonical Fields & Values
drop policy if exists "canonical_fields read" on canonical_fields;
create policy "canonical_fields read" on canonical_fields for select using (true);

drop policy if exists "canonical_fields staff manage" on canonical_fields;
create policy "canonical_fields staff manage" on canonical_fields
  for all using (current_employee_id() is not null);

drop policy if exists "canonical_values read" on canonical_values;
create policy "canonical_values read" on canonical_values
  for select using (
    exists (select 1 from applications a where a.id = application_id and (a.citizen_user_id = auth.uid() or current_employee_id() is not null))
  );

drop policy if exists "canonical_values staff manage" on canonical_values;
create policy "canonical_values staff manage" on canonical_values
  for all using (current_employee_id() is not null);

-- Data Mappings: Staff read, Admin manage
drop policy if exists "data_mappings staff read" on data_mappings;
create policy "data_mappings staff read" on data_mappings for select using (current_employee_id() is not null);

drop policy if exists "data_mappings staff manage" on data_mappings;
create policy "data_mappings staff manage" on data_mappings
  for all using (current_employee_role() in ('SYSTEM_ADMIN', 'DEPARTMENT_ADMIN'));

-- Verification Requests & Results
drop policy if exists "verification_requests access" on verification_requests;
create policy "verification_requests access" on verification_requests
  for select using (
    exists (select 1 from applications a where a.id = application_id and (a.citizen_user_id = auth.uid() or current_employee_id() is not null))
  );

drop policy if exists "verification_requests staff manage" on verification_requests;
create policy "verification_requests staff manage" on verification_requests
  for all using (current_employee_id() is not null);

drop policy if exists "verification_results staff only" on verification_results;
create policy "verification_results staff only" on verification_results
  for all using (current_employee_id() is not null);

-- Workflow Transitions & Step Executions
drop policy if exists "workflow_transitions read" on workflow_transitions;
create policy "workflow_transitions read" on workflow_transitions for select using (true);

drop policy if exists "workflow_transitions staff manage" on workflow_transitions;
create policy "workflow_transitions staff manage" on workflow_transitions
  for all using (current_employee_role() in ('SYSTEM_ADMIN', 'DEPARTMENT_ADMIN'));

drop policy if exists "workflow_step_executions staff" on workflow_step_executions;
create policy "workflow_step_executions staff" on workflow_step_executions
  for all using (current_employee_id() is not null);

-- Service Decision Policies
drop policy if exists "service_decision_policies read" on service_decision_policies;
create policy "service_decision_policies read" on service_decision_policies for select using (true);

drop policy if exists "service_decision_policies staff manage" on service_decision_policies;
create policy "service_decision_policies staff manage" on service_decision_policies
  for all using (current_employee_role() in ('SYSTEM_ADMIN', 'DEPARTMENT_ADMIN'));

-- Domain Events
drop policy if exists "domain_events citizen read" on domain_events;
create policy "domain_events citizen read" on domain_events
  for select using (
    exists (select 1 from applications a where a.id = application_id and a.citizen_user_id = auth.uid())
    or current_employee_id() is not null
  );

drop policy if exists "domain_events insert" on domain_events;
create policy "domain_events insert" on domain_events
  for insert with check (true);

-- Idempotency Keys
drop policy if exists "idempotency_keys access" on idempotency_keys;
create policy "idempotency_keys access" on idempotency_keys
  for all using (
    application_id is null or exists (select 1 from applications a where a.id = application_id and (a.citizen_user_id = auth.uid() or current_employee_id() is not null))
  );

-- =====================================================================
-- 27. PLATFORM CATALOG & SEED REFERENCE DATA
-- =====================================================================

-- Departments
insert into departments (id, code, name, government_level, is_active)
values
  ('d0000000-0000-0000-0000-000000000001', 'DEPT_INCOME_TAX', 'Income Tax Department (CBDT)', 'CENTRAL', true),
  ('d0000000-0000-0000-0000-000000000002', 'DEPT_HIGHER_EDU', 'Department of Higher Education', 'CENTRAL', true)
on conflict (code) do update set name = excluded.name, is_active = excluded.is_active;

-- Offices
insert into offices (id, department_id, code, name, city, state, pincode, is_active)
values
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'OFC_CPC_BLR', 'Central Processing Centre (CPC)', 'Bengaluru', 'Karnataka', '560500', true),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'OFC_HYD_01', 'Regional Processing Office Hyderabad', 'Hyderabad', 'Telangana', '500081', true)
on conflict (department_id, code) do update set name = excluded.name, is_active = excluded.is_active;

-- Connectors (Product Rule 9: DEMO / SANDBOX / PRODUCTION explicit representation)
insert into connectors (id, code, name, environment, connector_type, protocol, enabled, health_status)
values
  ('c0000000-0000-0000-0000-000000000001', 'CONN_UIDAI_AADHAAR', 'UIDAI Aadhaar Verification Service', 'DEMO', 'IDENTITY', 'REST_JSON', true, 'HEALTHY'),
  ('c0000000-0000-0000-0000-000000000002', 'CONN_DIGILOCKER', 'DigiLocker Document Verification Gateway', 'DEMO', 'DOCUMENT', 'REST_JSON', true, 'HEALTHY'),
  ('c0000000-0000-0000-0000-000000000003', 'CONN_PROTEAN_PAN', 'Protean / NSDL PAN Processing Core', 'DEMO', 'PAN_PROCESSING', 'REST_JSON', true, 'HEALTHY'),
  ('c0000000-0000-0000-0000-000000000004', 'CONN_SECURITY_PRINT', 'India Security Press Card Print Pipeline', 'DEMO', 'PRINTING', 'REST_JSON', true, 'HEALTHY'),
  ('c0000000-0000-0000-0000-000000000005', 'CONN_INDIAPOST', 'India Post Speed Post Tracking API', 'DEMO', 'DISPATCH', 'REST_JSON', true, 'HEALTHY')
on conflict (code) do update set name = excluded.name, health_status = excluded.health_status;

-- Canonical Fields
insert into canonical_fields (id, field_key, label, data_type, sensitive)
values
  ('f0000000-0000-0000-0000-000000000001', 'fullName', 'Full Legal Name', 'TEXT', false),
  ('f0000000-0000-0000-0000-000000000002', 'fatherName', 'Father / Parent Legal Name', 'TEXT', false),
  ('f0000000-0000-0000-0000-000000000003', 'dateOfBirth', 'Date of Birth (YYYY-MM-DD)', 'DATE', false),
  ('f0000000-0000-0000-0000-000000000004', 'gender', 'Gender', 'TEXT', false),
  ('f0000000-0000-0000-0000-000000000005', 'mobile', 'Mobile Number (10 Digits)', 'TEXT', true),
  ('f0000000-0000-0000-0000-000000000006', 'email', 'Email Address', 'TEXT', true),
  ('f0000000-0000-0000-0000-000000000007', 'aadhaarNumber', '12-Digit Aadhaar UID', 'TEXT', true),
  ('f0000000-0000-0000-0000-000000000008', 'address', 'Street Address', 'TEXT', false),
  ('f0000000-0000-0000-0000-000000000009', 'city', 'City / District', 'TEXT', false),
  ('f0000000-0000-0000-0000-000000000010', 'state', 'State / UT', 'TEXT', false),
  ('f0000000-0000-0000-0000-000000000011', 'pincode', '6-Digit Postal PIN Code', 'TEXT', false)
on conflict (field_key) do update set label = excluded.label, data_type = excluded.data_type;

-- Services: PAN Card Application (V2)
insert into services (id, code, name, description, provider_name, provider_level, version, is_active)
values (
  'a0000000-0000-0000-0000-000000000002',
  'PAN_ISSUANCE_01',
  'Permanent Account Number (PAN) Card Application (Form 49A)',
  'Official paperless issuance of Permanent Account Number (PAN) by Income Tax Department with instant e-PAN generation and optional doorstep physical PVC card delivery.',
  'Income Tax Department / Protean',
  'CENTRAL',
  2,
  true
)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  version = excluded.version,
  is_active = excluded.is_active;

-- Service Requirements for PAN
insert into service_requirements (id, service_id, requirement_key, requirement_type, label, field_key, document_type, required, order_index)
values
  ('b1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'REQ_AADHAAR_DOC', 'DOCUMENT', 'Aadhaar Card (Proof of Identity & Address)', null, 'AADHAAR', true, 1),
  ('b1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'REQ_DOB_PROOF', 'DOCUMENT', 'Proof of Date of Birth (Marksheet / Birth Cert / Aadhaar)', null, 'PREVIOUS_MARKSHEET', true, 2),
  ('b1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'REQ_ADDRESS_PROOF', 'DOCUMENT', 'Proof of Address (Utility Bill / Domicile / Aadhaar)', null, 'DOMICILE_CERTIFICATE', false, 3),
  ('b1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'REQ_FULL_NAME', 'PROFILE_FIELD', 'Applicant Legal Full Name', 'fullName', null, true, 4),
  ('b1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'REQ_FATHER_NAME', 'PROFILE_FIELD', 'Father / Parent Name', 'fatherName', null, true, 5),
  ('b1000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'REQ_DOB', 'PROFILE_FIELD', 'Date of Birth', 'dateOfBirth', null, true, 6),
  ('b1000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'REQ_CONSENT_AADHAAR', 'CONSENT_SCOPE', 'UIDAI Aadhaar Electronic Verification Consent', null, null, true, 7)
on conflict (service_id, requirement_key) do update set
  label = excluded.label,
  required = excluded.required,
  order_index = excluded.order_index;

-- Service Decision Policy: Human Review on Exception
insert into service_decision_policies (id, service_id, review_mode, allow_officer_return, allow_officer_reject)
values (
  'ea000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'HUMAN_ON_EXCEPTION',
  true,
  true
)
on conflict (service_id) do update set
  review_mode = excluded.review_mode,
  allow_officer_return = excluded.allow_officer_return,
  allow_officer_reject = excluded.allow_officer_reject;

-- Workflow Definition for PAN
insert into workflow_definitions (id, service_id, code, version, is_active)
values (
  'eb000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'WF_PAN_LIFECYCLE',
  1,
  true
)
on conflict (service_id, code, version) do update set is_active = excluded.is_active;

-- Workflow Steps
insert into workflow_steps (id, workflow_definition_id, step_key, label, step_type, requires_human, order_hint)
values
  ('ec000000-0000-0000-0000-000000000001', 'eb000000-0000-0000-0000-000000000001', 'STEP_APPLY', 'Citizen Application & Staging', 'AUTOMATED', false, 1),
  ('ec000000-0000-0000-0000-000000000002', 'eb000000-0000-0000-0000-000000000001', 'STEP_VALIDATE', 'Data Schema Validation', 'AUTOMATED', false, 2),
  ('ec000000-0000-0000-0000-000000000003', 'eb000000-0000-0000-0000-000000000001', 'STEP_CONSENT', 'Digital Consent Capture', 'AUTOMATED', false, 3),
  ('ec000000-0000-0000-0000-000000000004', 'eb000000-0000-0000-0000-000000000001', 'STEP_VERIFY', 'UIDAI & DigiLocker Verification', 'AUTOMATED', false, 4),
  ('ec000000-0000-0000-0000-000000000005', 'eb000000-0000-0000-0000-000000000001', 'STEP_CROSS_SYSTEM', 'Multi-System Cross Validation', 'AUTOMATED', false, 5),
  ('ec000000-0000-0000-0000-000000000006', 'eb000000-0000-0000-0000-000000000001', 'STEP_OFFICER_REVIEW', 'Officer Human Verification Gate', 'HUMAN', true, 6),
  ('ec000000-0000-0000-0000-000000000007', 'eb000000-0000-0000-0000-000000000001', 'STEP_PAN_GEN', 'Instant e-PAN Allotment', 'AUTOMATED', false, 7),
  ('ec000000-0000-0000-0000-000000000008', 'eb000000-0000-0000-0000-000000000001', 'STEP_PHYSICAL_DISPATCH', 'Physical Card Dispatch (Optional)', 'AUTOMATED', false, 8),
  ('ec000000-0000-0000-0000-000000000009', 'eb000000-0000-0000-0000-000000000001', 'STEP_COMPLETED', 'Lifecycle Completed', 'END', false, 9)
on conflict (workflow_definition_id, step_key) do update set
  label = excluded.label,
  requires_human = excluded.requires_human,
  order_hint = excluded.order_hint;

-- Service SLA Policy
insert into service_sla_policies (id, service_id, workflow_step_id, target_minutes, escalation_after_minutes, is_active)
values
  ('ed000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'ec000000-0000-0000-0000-000000000004', 15, 30, true),
  ('ed000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'ec000000-0000-0000-0000-000000000006', 120, 240, true)
on conflict (id) do update set
  target_minutes = excluded.target_minutes,
  escalation_after_minutes = excluded.escalation_after_minutes;
