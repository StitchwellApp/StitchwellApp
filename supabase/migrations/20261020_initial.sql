-- Stitchwell MVP schema. Run in a Client-owned Supabase project.
-- All section release instants are 00:00 UTC on the calculated date.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  bio text not null default '',
  location text not null default '',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sals (
  id uuid primary key default gen_random_uuid(),
  designer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 100),
  description text not null default '',
  theme_tags text[] not null default '{}',
  cover_path text,
  section_count integer not null check (section_count >= 1),
  start_date date not null,
  cadence_days integer not null check (cadence_days >= 1),
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published')),
  access_model text not null default 'free' check (access_model in ('free', 'paid')),
  price_cents integer not null default 0 check (price_cents >= 0),
  currency_code text not null default 'USD' check (currency_code ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint free_sals_have_no_price check (access_model <> 'free' or price_cents = 0)
);
create index sals_designer_idx on public.sals(designer_id);
create index sals_published_start_idx on public.sals(start_date) where publication_status = 'published';
create index sals_tags_idx on public.sals using gin(theme_tags);

create table public.sal_sections (
  id uuid primary key default gen_random_uuid(),
  sal_id uuid not null references public.sals(id) on delete cascade,
  section_number integer not null check (section_number >= 1),
  title text not null default '',
  created_at timestamptz not null default now(),
  unique(sal_id, section_number)
);
create index sal_sections_sal_idx on public.sal_sections(sal_id);

create table public.pattern_files (
  id uuid primary key default gen_random_uuid(),
  sal_id uuid not null references public.sals(id) on delete cascade,
  section_number integer,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size between 1 and 52428800),
  created_at timestamptz not null default now(),
  foreign key (sal_id, section_number) references public.sal_sections(sal_id, section_number),
  constraint pattern_file_type check (lower(file_name) ~ '\.(pdf|zip|jpg|jpeg|png)$')
);
create index pattern_files_sal_idx on public.pattern_files(sal_id, section_number);

create table public.enrollments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  sal_id uuid not null references public.sals(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(user_id, sal_id)
);
create index enrollments_sal_idx on public.enrollments(sal_id);

create or replace function public.section_release_at(p_start date, p_cadence integer, p_number integer)
returns timestamptz language sql immutable set search_path = '' as $$
  select ((p_start + ((p_number - 1) * p_cadence))::timestamp at time zone 'UTC');
$$;

create or replace function public.can_read_section(p_sal uuid, p_number integer)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.sals s
    join public.enrollments e on e.sal_id = s.id
    where s.id = p_sal and e.user_id = (select auth.uid())
      and s.publication_status = 'published' and s.access_model = 'free'
      and p_number between 1 and s.section_count
      and public.section_release_at(s.start_date, s.cadence_days, p_number) <= now()
  );
$$;

create or replace function public.can_read_pattern_object(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pattern_files f
    join public.sals s on s.id = f.sal_id
    where f.storage_path = p_path and (
      s.designer_id = (select auth.uid()) or
      (f.section_number is not null and public.can_read_section(f.sal_id, f.section_number))
    )
  );
$$;

create or replace function public.validate_section_number()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.section_number > (select section_count from public.sals where id = new.sal_id) then
    raise exception 'section_number exceeds SAL section_count';
  end if;
  return new;
end;
$$;
create trigger validate_section_number before insert or update on public.sal_sections
for each row execute function public.validate_section_number();

create or replace function public.create_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;
create trigger create_profile_after_signup after insert on auth.users
for each row execute function public.create_profile();

alter table public.profiles enable row level security;
alter table public.sals enable row level security;
alter table public.sal_sections enable row level security;
alter table public.pattern_files enable row level security;
alter table public.enrollments enable row level security;

create policy "profiles are readable" on public.profiles for select to authenticated using (true);
create policy "users edit their profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "published sals or own drafts are readable" on public.sals for select to authenticated using (publication_status = 'published' or designer_id = (select auth.uid()));
create policy "designers create free sals" on public.sals for insert to authenticated with check (designer_id = (select auth.uid()) and access_model = 'free' and price_cents = 0);
create policy "designers edit own free sals" on public.sals for update to authenticated using (designer_id = (select auth.uid())) with check (designer_id = (select auth.uid()) and access_model = 'free' and price_cents = 0);
create policy "designers delete own sals" on public.sals for delete to authenticated using (designer_id = (select auth.uid()));
create policy "sections visible to designers and enrolled stitchers after release" on public.sal_sections for select to authenticated using (
  exists (select 1 from public.sals s where s.id = sal_id and s.designer_id = (select auth.uid()))
  or public.can_read_section(sal_id, section_number)
);
create policy "designers add own sections" on public.sal_sections for insert to authenticated with check (exists (select 1 from public.sals s where s.id = sal_id and s.designer_id = (select auth.uid())));
create policy "designers edit own sections" on public.sal_sections for update to authenticated using (exists (select 1 from public.sals s where s.id = sal_id and s.designer_id = (select auth.uid()))) with check (exists (select 1 from public.sals s where s.id = sal_id and s.designer_id = (select auth.uid())));
create policy "designers delete own sections" on public.sal_sections for delete to authenticated using (exists (select 1 from public.sals s where s.id = sal_id and s.designer_id = (select auth.uid())));
create policy "pattern metadata follows access" on public.pattern_files for select to authenticated using (
  exists (select 1 from public.sals s where s.id = sal_id and s.designer_id = (select auth.uid()))
  or (section_number is not null and public.can_read_section(sal_id, section_number))
);
create policy "designers add pattern metadata" on public.pattern_files for insert to authenticated with check (exists (select 1 from public.sals s where s.id = sal_id and s.designer_id = (select auth.uid())));
create policy "designers remove pattern metadata" on public.pattern_files for delete to authenticated using (exists (select 1 from public.sals s where s.id = sal_id and s.designer_id = (select auth.uid())));
create policy "users see their enrollments" on public.enrollments for select to authenticated using (user_id = (select auth.uid()));
create policy "users join published free sals" on public.enrollments for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (select 1 from public.sals s where s.id = sal_id and s.publication_status = 'published' and s.access_model = 'free')
);
create policy "users leave their sals" on public.enrollments for delete to authenticated using (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sal-patterns', 'sal-patterns', false, 52428800, array['application/pdf','application/zip','application/x-zip-compressed','application/octet-stream','image/jpeg','image/png'])
on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sal-covers', 'sal-covers', true, 52428800, array['image/jpeg','image/png'])
on conflict (id) do nothing;

-- Path convention: <sal-uuid>/<unique-file-name>. A full pattern has a null
-- section_number and stays designer-only. Released section files are readable
-- only after enrollment and their global release instant.
create policy "read authorized pattern files" on storage.objects for select to authenticated using (
  bucket_id = 'sal-patterns' and public.can_read_pattern_object(name)
);
create policy "designers upload pattern files" on storage.objects for insert to authenticated with check (
  bucket_id = 'sal-patterns' and exists (
    select 1 from public.sals s where s.id::text = split_part(name, '/', 1) and s.designer_id = (select auth.uid())
  )
);
create policy "designers delete pattern files" on storage.objects for delete to authenticated using (
  bucket_id = 'sal-patterns' and exists (
    select 1 from public.sals s where s.id::text = split_part(name, '/', 1) and s.designer_id = (select auth.uid())
  )
);
create policy "designers upload covers" on storage.objects for insert to authenticated with check (
  bucket_id = 'sal-covers' and exists (
    select 1 from public.sals s where s.id::text = split_part(name, '/', 1) and s.designer_id = (select auth.uid())
  )
);
create policy "designers delete covers" on storage.objects for delete to authenticated using (
  bucket_id = 'sal-covers' and exists (
    select 1 from public.sals s where s.id::text = split_part(name, '/', 1) and s.designer_id = (select auth.uid())
  )
);
