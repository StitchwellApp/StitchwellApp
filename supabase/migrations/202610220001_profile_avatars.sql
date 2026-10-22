insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 52428800, array['image/jpeg','image/png'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "users upload their profile photos" on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars' and split_part(name, '/', 1) = (select auth.uid())::text
);
create policy "users replace their profile photos" on storage.objects for update to authenticated
using (
  bucket_id = 'avatars' and split_part(name, '/', 1) = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars' and split_part(name, '/', 1) = (select auth.uid())::text
);
create policy "users delete their profile photos" on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars' and split_part(name, '/', 1) = (select auth.uid())::text
);
