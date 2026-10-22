create policy "published free sals are discoverable" on public.sals
for select to anon
using (publication_status = 'published' and access_model = 'free');
