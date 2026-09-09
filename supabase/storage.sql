-- =============================================================================
-- ECOM ACADÉMIE PRO — Storage buckets & policies
-- =============================================================================
-- Run this AFTER schema.sql, in the Supabase SQL editor.
-- Creates 3 buckets:
--   - videos     (private — accessed only via short-lived signed URLs)
--   - documents  (private — same)
--   - images     (public  — covers, thumbnails, avatars: fine to be public)
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('videos', 'videos', false, null),
  ('documents', 'documents', false, null),
  ('images', 'images', true, null)
on conflict (id) do nothing;

-- NOTE on file size limits: Supabase's own project-wide upload limit
-- (Project Settings > Storage > Upload file size limit) is the real ceiling —
-- raise it there for large videos (available on paid plans, several GB).
-- The `file_size_limit` column above is an optional PER-BUCKET override; we
-- leave it `null` (= no extra restriction beyond the project-wide limit).

-- ---------- POLICIES: videos & documents (private buckets) ----------
-- Only admins can write. Reads happen exclusively through
-- `supabase.storage.createSignedUrl()` called from our trusted server-side
-- API route (/api/media/signed-url), using the service_role key — so no
-- direct "select" policy for regular authenticated users is needed or
-- granted on these two buckets.

create policy "Admins upload videos"
  on storage.objects for insert
  with check (bucket_id = 'videos' and is_admin());

create policy "Admins update videos"
  on storage.objects for update
  using (bucket_id = 'videos' and is_admin());

create policy "Admins delete videos"
  on storage.objects for delete
  using (bucket_id = 'videos' and is_admin());

create policy "Admins upload documents"
  on storage.objects for insert
  with check (bucket_id = 'documents' and is_admin());

create policy "Admins update documents"
  on storage.objects for update
  using (bucket_id = 'documents' and is_admin());

create policy "Admins delete documents"
  on storage.objects for delete
  using (bucket_id = 'documents' and is_admin());

-- ---------- POLICIES: images (public bucket) ----------
-- Anyone can view (public bucket), but only admins can upload/manage —
-- except student avatars, which the student uploads for themselves.

create policy "Anyone can view images"
  on storage.objects for select
  using (bucket_id = 'images');

create policy "Admins manage images"
  on storage.objects for all
  using (bucket_id = 'images' and is_admin());

create policy "Users upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'images' and auth.uid() is not null and name like 'avatars/' || auth.uid() || '%');
