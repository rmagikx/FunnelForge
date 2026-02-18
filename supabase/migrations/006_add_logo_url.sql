-- ============================================================
-- 006: Add logo_url column to personas table
-- Stores the public URL of the brand logo image.
-- ============================================================

alter table public.personas add column logo_url text;
