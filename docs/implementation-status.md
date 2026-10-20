# Implementation status · 20 October 2026

## Started locally

- Created a React/Vite app packaged with Capacitor for Android and a responsive designer web view.
- Built visual previews of home, search/browse, Live/Upcoming/Library filters, SAL details, release calendar, personal library, profile text editing, designer overview, and SAL creation.
- Added demo join/profile/SAL metadata persistence in browser local storage. This is sample-only data.
- Added PDF/ZIP/JPG/PNG file selection and a 50 MB per-file check to the designer preview. Upload, cover image selection, and mapping pattern files to sections still need implementation.
- Added a Supabase schema draft with profiles, free SALs, sections, pattern files, enrollments, UTC release calculation, RLS, and private pattern storage policies. It has not been applied or tested in a live project.
- Built the web app and a local Android debug APK. Desktop and mobile preview renders and key local flows were checked.

## Next implementation work

1. Connect the app to the Client-owned Supabase project; apply and verify the migration and storage policies with designer/stitcher test accounts.
2. Implement email sign-up/sign-in, Google sign-in on Android and web, password reset, account deletion, and profile photo upload.
3. Replace sample/local data with authenticated SAL creation, pattern and cover uploads, section-file assignment, publication, discovery, enrollments, and secure section downloads.
4. Verify date-based access at 00:00 UTC across time zones, including a late join to a Library SAL. Add device test builds at each milestone.
5. Complete core-flow QA, deployment, Client-owned Play closed testing and production submission, and handover under the agreement.

## Inputs needed for live work

The user asked for local work for now. Live integration and schedule confirmation await the Client-owned GitHub repository, Supabase project, Google OAuth configuration, hosting, Google Play Console, source brand/prototype assets, test content, and confirmation of deposit clearance and the agreed Start Date. Do not infer milestone target dates from the agreement's provisional schedule.

## Implementation notes

- Schedule C and the main agreement control the MVP over future ideas in the attached brief and wording visible in the mockup.
- Every section's release instant is calculated from `start_date + (section_number - 1) × cadence_days` at 00:00 UTC. The interface formats that instant in the device's local time zone.
- A full pattern file must stay designer-only. Stitchers should receive only released section files after enrollment, through private storage policies. A legitimately downloaded file can still be copied by a user.
- Google Play testing/submission is a later milestone and depends on Client-owned accounts, testers, store materials, and approvals. A local debug APK does not satisfy that milestone.
