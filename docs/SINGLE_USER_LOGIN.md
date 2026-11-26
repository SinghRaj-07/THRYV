# THRYV single-user private test login

The application supports a single assigned username while continuing to use Supabase Auth and the existing profiles table. Credentials are never committed to this repository.

## Vercel environment variables

Add these three **server-only** variables to the Vercel project for Preview and Production, then redeploy:

- `THRYV_SINGLE_USER_USERNAME`: the one permitted username
- `THRYV_SINGLE_USER_PASSWORD`: the temporary password (use a stronger password before production)
- `THRYV_SINGLE_USER_EMAIL`: an email address controlled by the project owner; used internally as the Supabase Auth identity and never shown on the login form

The project must already have `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` configured. Never expose the service role key with a `NEXT_PUBLIC_` prefix.

On the first successful login, the server creates the Supabase Auth user if it does not exist, confirms that email internally, upserts the matching profile, and issues the existing HTTP-only session cookie. Subsequent logins use Supabase password authentication.

## Access

All non-API website routes redirect to `/auth` without a session. The registration route is disabled. API endpoints continue to validate the Supabase session independently.

## Important

The temporary password requested for testing is weak. Replace it with a unique password before sharing the deployment or enabling production access. Keep all three single-user variables in Vercel Environment Variables, not in source control.
