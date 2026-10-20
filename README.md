# Stitchwell MVP

Local implementation started from the executed Stitchwell Software Development Agreement (effective 16 October 2026), with Schedule C defining the included features, Schedule E providing the visual reference, and Schedule F clarifying release times and Google Play testing. The full signed PDF remains outside this repository.

## Current state

This repository contains a responsive Stitchwell preview, an Android Capacitor project, and an initial Supabase migration. The preview has sample stitch-alongs and saves demo joins, profile text, and designer SAL metadata in this browser's local storage. **It is not connected to Supabase.** Pattern files selected in the designer form are validated locally and discarded when the form is saved. Do not use the preview for real user or pattern data.

See [docs/implementation-status.md](docs/implementation-status.md) for delivered work, remaining work, and client dependencies.

## Run locally

Requires Node.js 22 or newer.

```sh
npm install
npm run dev
```

Open `http://localhost:5173/` for the stitcher preview and `http://localhost:5173/designer` for the designer studio.

```sh
npm run build
npm run lint
```

## Android debug build

Capacitor 8 needs Android SDK and JDK 21. With `JAVA_HOME` pointing to JDK 21:

```sh
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

The installable debug APK is `android/app/build/outputs/apk/debug/app-debug.apk`. It is a preview build, not a Play Store release. The current Android application ID `com.stitchwell.app` is provisional until the Client confirms the Play Console listing and final package name.

## Supabase setup when the Client-owned project is available

1. Review and apply `supabase/migrations/20261020_initial.sql` to the Client-owned Supabase project. The migration has not yet been executed against a project.
2. Add the project URL and publishable key to `.env.local` using `.env.example` as a template. Never put a service-role key in the frontend.
3. Configure email and Google auth, redirect URLs, storage, and account deletion in the Client-owned project.
4. Replace the local preview data layer with authenticated Supabase queries and upload flows; verify the access policies with real test accounts before release.

The schema reserves an `access_model` and price fields for a later paid SAL phase, while the MVP write policies permit only free SALs. Pattern storage is private. Section access is calculated from the SAL's UTC start date and cadence, and requires enrollment; a stitcher joining a fully released SAL can access all already released sections.

## Scope boundary

The agreed MVP includes Android for stitchers, a responsive designer web experience, free SAL creation, discovery, a release calendar, pattern library, profiles, and email/Google authentication. Paid SALs, notifications, a social feed, and admin tools are outside the current scope. Store submission and live deployment require the Client-owned accounts, assets, and approvals described in the agreement.
