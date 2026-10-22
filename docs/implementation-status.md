# Implementation status · 22 October 2026

## Started locally

- Created a React/Vite app packaged with Capacitor for Android and a responsive designer web view.
- Built visual previews of home, search/browse, Live/Upcoming/Library filters, SAL details, release calendar, personal library, profile editing, designer overview, and SAL creation.
- Added demo data persistence in browser local storage when Supabase is unavailable or no account is signed in.
- Added local JPG/PNG cover and profile photo previews, compressed for the browser preview.
- Added PDF/ZIP/JPG/PNG file selection, a 50 MB per-file check, removal, and mapping to a numbered section or a designer-only full-pattern file. Local preview mode discards file bytes; signed-in designers upload them to private Supabase storage.
- Added weekly, every-three-days, and custom whole-day release cadence choices, plus a positive section-count field.
- Applied migrations to the Stitchwell Supabase project: profiles, free SALs, sections, pattern files, enrollments, UTC release calculation, RLS, private pattern storage, public covers, and profile avatars.
- Connected email/password sign-in, sign-up, password reset, profile saves, public SAL discovery, enrollments, designer SAL publishing, pattern and cover uploads, signed downloads for released sections, and account deletion with uploaded-file cleanup.
- Configured the local app with the project URL and publishable key in ignored `.env.local`.
- The Supabase CLI confirms migrations `20261020`, `202610220001`, and `202610220002` are applied, and the `delete-account` Edge Function is deployed. The web build and Android debug build succeed. No live user-flow or on-device checks have been run.

## Next implementation work

1. Configure Google OAuth credentials and redirect URIs in the Client-owned Google and Supabase accounts; set the production site URL, allowed redirects, and production email delivery.
2. Verify live flows and access policies with Client-provided designer and stitcher accounts, including 00:00 UTC release boundaries, late joins to Library SALs, and account deletion.
3. Rebuild and device-check Android, deploy the designer site, complete Client-owned Play closed testing and production submission, and hand over under the agreement.

## Inputs needed for live work

The Client's Supabase project and GitHub repository are now linked. Google OAuth credentials, hosting/site domain, Google Play Console access, source brand/prototype assets, test content, and confirmation of deposit clearance and the agreed Start Date remain outstanding. Do not infer milestone target dates from the agreement's provisional schedule.

## Implementation notes

- Schedule C and the main agreement control the MVP over future ideas in the attached brief and wording visible in the mockup.
- Every section's release instant is calculated from `start_date + (section_number - 1) × cadence_days` at 00:00 UTC. The interface formats that instant in the device's local time zone.
- A full pattern file must stay designer-only. Stitchers should receive only released section files after enrollment, through private storage policies. A legitimately downloaded file can still be copied by a user.
- In unauthenticated preview mode, SAL/profile metadata and compressed image previews remain in browser storage and pattern file bytes are discarded. Signed-in designer SALs and pattern files use the connected Supabase project.
- Google Play testing/submission is a later milestone and depends on Client-owned accounts, testers, store materials, and approvals. A local debug APK does not satisfy that milestone.
