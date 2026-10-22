# Stitchwell MVP

Local implementation started from the executed Stitchwell Software Development Agreement (effective 16 October 2026), with Schedule C defining the included features, Schedule E providing the visual reference, and Schedule F clarifying release times and Google Play testing. The full signed PDF remains outside this repository.

## Current state

This repository contains the responsive Stitchwell app, an Android Capacitor project, and a connected Supabase backend. The schema and storage policies are deployed to the Stitchwell project. With `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` configured, the app supports email/password authentication, account profile data, public SAL discovery, SAL publishing, enrollments, signed access to released pattern files, and account deletion with stored-file cleanup. Without those values, it falls back to sample data and browser-local preview behavior.

Google sign-in still requires OAuth credentials and redirect configuration in the Client's Google and Supabase accounts. Production email delivery and final redirect URLs need the agreed site domain and email service configuration. Never put a Supabase secret/service-role key in the frontend.

See [docs/implementation-status.md](docs/implementation-status.md) for delivered work, remaining work, and client dependencies.

## Run locally

Requires Node.js 22 or newer.

```sh
npm install
npm run dev
```

Open `http://localhost:5173/` for the stitcher preview and `http://localhost:5173/designer` for the designer studio.

To use the live backend, copy `.env.example` to `.env.local` and set the project URL and publishable key. Without those values, the app remains in local preview mode.

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

## Supabase configuration

1. The project is linked in the local Supabase CLI configuration. Migrations `20261020_initial.sql`, `202610220001_profile_avatars.sql`, and `202610220002_public_discovery.sql` are applied. The `delete-account` Edge Function is deployed.
2. `.env.local` contains the project URL and publishable key and is ignored by Git. Copy the values from `.env.example` into deployment environments. Never use a secret/service-role key in the frontend.
3. Configure Google OAuth credentials, the production site and redirect URLs, and production email delivery in the Client-owned accounts.
4. Verify the live flows and access policies with Client-provided test accounts before release.

The schema reserves an `access_model` and price fields for a later paid SAL phase, while the MVP write policies permit only free SALs. Pattern storage is private. Section access is calculated from the SAL's UTC start date and cadence, and requires enrollment; a stitcher joining a fully released SAL can access all already released sections.

## Scope boundary

The agreed MVP includes Android for stitchers, a responsive designer web experience, free SAL creation, discovery, a release calendar, pattern library, profiles, and email/Google authentication. Paid SALs, notifications, a social feed, and admin tools are outside the current scope. Store submission and live deployment require the Client-owned accounts, assets, and approvals described in the agreement.
