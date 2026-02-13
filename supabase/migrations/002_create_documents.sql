-- ============================================================
-- 002: Create documents table
-- Tracks files uploaded by users (PDFs, DOCX, CSVs, etc.)
-- that feed into persona analysis.
-- extracted_text stores the parsed content for AI processing.
-- ============================================================

create table public.documents (
  id             uuid primary key default gen_random_uuid(),
  persona_id     uuid not null references public.personas(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  file_name      text not null,
  file_type      text not null,
  file_size      integer not null,
  storage_path   text not null,
  extracted_text text,
  created_at     timestamptz not null default now()
);

-- Fast lookups by persona and by user
create index idx_documents_persona_id on public.documents(persona_id);
create index idx_documents_user_id on public.documents(user_id);

comment on table public.documents is 'User-uploaded files used for persona analysis';
