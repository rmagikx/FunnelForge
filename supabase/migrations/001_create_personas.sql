-- ============================================================
-- 001: Create personas table
-- Stores buyer persona profiles linked to each user.
-- persona_data (jsonb) holds the AI-generated persona details
-- (demographics, psychographics, pain points, etc.)
-- ============================================================

create table public.personas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  org_type   text,
  persona_data jsonb default '{}'::jsonb,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fast lookups for "all personas belonging to a user"
create index idx_personas_user_id on public.personas(user_id);

-- Auto-update the updated_at timestamp on every row change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_personas_updated_at
  before update on public.personas
  for each row
  execute function public.handle_updated_at();

comment on table public.personas is 'Buyer personas created by users from uploaded documents';
