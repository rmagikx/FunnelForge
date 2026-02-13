-- ============================================================
-- 005: Storage bucket and policies
-- Creates a private 'user-documents' bucket for file uploads.
-- Each user can only access files under their own folder:
--   user-documents/{user_id}/*
-- ============================================================

-- Create the private storage bucket
insert into storage.buckets (id, name, public)
values ('user-documents', 'user-documents', false);

-- --------------------------------------------------------
-- Upload: users can insert files into their own folder
-- --------------------------------------------------------
create policy "Users can upload to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'user-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- --------------------------------------------------------
-- Read: users can view/download their own files
-- --------------------------------------------------------
create policy "Users can read their own files"
  on storage.objects for select
  using (
    bucket_id = 'user-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- --------------------------------------------------------
-- Update: users can overwrite their own files
-- --------------------------------------------------------
create policy "Users can update their own files"
  on storage.objects for update
  using (
    bucket_id = 'user-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'user-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- --------------------------------------------------------
-- Delete: users can remove their own files
-- --------------------------------------------------------
create policy "Users can delete their own files"
  on storage.objects for delete
  using (
    bucket_id = 'user-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
