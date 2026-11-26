# THRYV — Social platform

A responsive, glassmorphism social platform based on the supplied THRYV dashboard reference.

## Stack
- Next.js 15 App Router + React 19 + TypeScript
- Supabase Auth, PostgreSQL, Row Level Security and Storage
- Tailwind CSS + Lucide icons

## Local setup
1. Install Node.js 20 or newer.
2. Create a Supabase project.
3. In Supabase SQL Editor, run `supabase/schema.sql`.
4. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; never prefix this with NEXT_PUBLIC)
5. Run `npm install`.
6. Run `npm run dev` and open http://localhost:3000.

## Deploy to Vercel
Import this GitHub repository into Vercel, add the same environment variables, then deploy. Supabase remains the persistent database/auth/media backend. Set your Supabase Auth Site URL and allowed redirect URLs to your deployed domain.

## Implemented in this starter
- Email/password registration and login through Supabase Auth; access token stored in an HttpOnly cookie
- Authenticated profile read/update and public/private profile preference
- Persistent feed, post creation, image/video upload, likes, comments and share records
- Persistent direct-message API and notification API
- PostgreSQL schema, indexes, account creation trigger, RLS policies and media bucket
- Responsive three-column glass dashboard with mobile layout

## Important deployment notes
- Apply the SQL schema before using the app.
- Configure Supabase email confirmation policy to match your desired signup flow.
- The service-role key is used only by server route handlers. Keep it secret.
- Message and notification tables are prepared for Supabase Realtime publication; a production realtime inbox UI, story publishing/viewing, follow graph, moderation/reporting, password reset, refresh-token rotation and end-to-end encrypted chat are not yet complete. Do not treat this starter as production-ready until those are implemented and tested.
- This repository cannot be fully exercised until a Supabase project and its environment secrets are configured.
