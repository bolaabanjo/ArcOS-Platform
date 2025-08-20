# Changelog

This file tracks the significant changes, features, and improvements made to the ArcOS Platform project.

## 2025-08-19

### Feat
- Initial project setup with Next.js (React).
- Integrated Supabase for backend services (PostgreSQL, Supabase Auth).
- Implemented basic user authentication (Sign Up, Sign In) using Supabase Auth.
- Developed initial user profile creation/editing system with fields for full name, username, role/specialization, location, and bio.
- Added a "Pro tip" for X/Twitter username recommendation during profile setup.
- Configured environment variables for Supabase credentials (manual setup).
- Established a Supabase client and session provider for client-side components.
- Initialized Git repository and pushed code to GitHub.

### Fix
- Corrected `@supabase/ssr` import issue in `client.ts` by using `@supabase/supabase-js` for browser client.
- Ensured all client components (`signin/page.tsx`, `signup/page.tsx`, `onboarding/profile-setup/page.tsx`, `dashboard/page.tsx`, `portfolio/edit/[id]/page.tsx`) have the `'use client'` directive.
- Refactored server-side Supabase client initialization in `layout.tsx` to use a dedicated helper (`utils/supabase/server.ts`), resolving persistent session/cookie handling errors and redirects.
- Fixed `react/no-unescaped-entities` error in `signin/page.tsx`.
- Addressed `@typescript-eslint/no-explicit-any` warning in `utils/supabase/server.ts` by providing explicit types.
- Simplified `portfolio/edit/[id]/page.tsx` to a basic display to troubleshoot Vercel build issues.
- Resolved `PageProps` type error in `portfolio/edit/[id]/page.tsx` by directly defining `params` type in component signature.
