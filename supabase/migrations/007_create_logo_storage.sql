-- ============================================================
-- 007: Storage bucket for brand logos
-- Creates a public 'brand-logos' bucket so logos can be
-- rendered in <img> tags without signed URLs.
-- Each user can only manage files under their own folder:
--   brand-logos/{user_id}/*
-- ============================================================

-- Create the public storage bucket
insert into storage.buckets (id, name, public)
values ('brand-logos', 'brand-logos', true);

-- --------------------------------------------------------
-- Upload: users can insert logos into their own folder
-- --------------------------------------------------------
create policy "Users can upload logos to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'brand-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- --------------------------------------------------------
-- Read: anyone can view logos (public bucket)
-- --------------------------------------------------------
create policy "Anyone can view logos"
  on storage.objects for select
  using (
    bucket_id = 'brand-logos'
  );

-- --------------------------------------------------------
-- Update: users can overwrite their own logos
-- --------------------------------------------------------
create policy "Users can update their own logos"
  on storage.objects for update
  using (
    bucket_id = 'brand-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'brand-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- --------------------------------------------------------
-- Delete: users can remove their own logos
-- --------------------------------------------------------
create policy "Users can delete their own logos"
  on storage.objects for delete
  using (
    bucket_id = 'brand-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
