-- ============================================================
-- 004: Row Level Security policies
-- Enables RLS on all tables and creates policies that enforce
-- complete user isolation: every query is scoped to
-- auth.uid() = user_id.
-- ============================================================

-- --------------------------------------------------------
-- PERSONAS
-- --------------------------------------------------------
alter table public.personas enable row level security;

create policy "Users can view their own personas"
  on public.personas for select
  using (auth.uid() = user_id);

create policy "Users can create their own personas"
  on public.personas for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own personas"
  on public.personas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own personas"
  on public.personas for delete
  using (auth.uid() = user_id);

-- --------------------------------------------------------
-- DOCUMENTS
-- --------------------------------------------------------
alter table public.documents enable row level security;

create policy "Users can view their own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can upload their own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own documents"
  on public.documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- --------------------------------------------------------
-- GENERATIONS
-- --------------------------------------------------------
alter table public.generations enable row level security;

create policy "Users can view their own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can create their own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own generations"
  on public.generations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own generations"
  on public.generations for delete
  using (auth.uid() = user_id);
