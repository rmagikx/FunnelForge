-- ============================================================
-- 003: Create generations table
-- Stores each content generation request and its output.
-- channels is a text array (e.g. {'email', 'landing_page'}).
-- generated_content (jsonb) holds the structured AI output
-- keyed by channel name.
-- ============================================================

create table public.generations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  persona_id        uuid not null references public.personas(id) on delete cascade,
  problem_statement text not null,
  channels          text[] not null default '{}',
  generated_content jsonb default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

-- Fast lookups by user and by persona
create index idx_generations_user_id on public.generations(user_id);
create index idx_generations_persona_id on public.generations(persona_id);

comment on table public.generations is 'AI-generated funnel content tied to a persona and problem statement';
