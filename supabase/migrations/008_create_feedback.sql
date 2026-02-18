-- ============================================================
-- 008: Feedback table
-- Stores user feedback with text and star ratings (1-5).
-- ============================================================

create table public.funnel_feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  user_name   text not null,
  feedback_text text not null,
  stars       smallint not null check (stars >= 1 and stars <= 5),
  created_at  timestamptz not null default now()
);

-- Enable RLS
alter table public.funnel_feedback enable row level security;

-- Users can view their own feedback
create policy "Users can view their own feedback"
  on public.funnel_feedback for select
  using (auth.uid() = user_id);

-- Users can create their own feedback
create policy "Users can create their own feedback"
  on public.funnel_feedback for insert
  with check (auth.uid() = user_id);

-- Index for querying by user
create index idx_feedback_user_id on public.funnel_feedback(user_id);
