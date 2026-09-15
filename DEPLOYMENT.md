# Deployment

## Render API

Create a Render Web Service from this repository, or use the root `render.yaml` blueprint. It must be a web service running FastAPI, not a static site.

- Root directory: `backend`
- Build command: `pip install -r requirements-render.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `SUPABASE_URL`, `SUPABASE_KEY`, `GROQ_API_KEY`, `CORS_ORIGINS`, `DEMO_LOGIN_ENABLED=true` for the hackathon demo bypass

Set `CORS_ORIGINS` to the exact Vercel frontend origin, without a trailing slash:

```text
https://your-frontend.vercel.app
```

For this project:

```text
https://backlog-monitoring-agent-vu.vercel.app
```

After deployment, verify the API returns JSON at `/` and `/api/dashboard`.

## Vercel frontend

Set the Vercel project Root Directory to `frontend` and add these build-time variables:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
VITE_API_URL=https://backlog-monitoring-agent.onrender.com
```

Redeploy after changing variables. Vite embeds `VITE_*` values during the build.

## Supabase redirects

In Supabase Authentication URL Configuration, add the actual frontend callback URL:

```text
https://backlog-monitoring-agent-vu.vercel.app/auth
```

Set the Supabase **Site URL** to the deployed frontend origin, for example:

```text
https://backlog-monitoring-agent-vu.vercel.app
```

Remove stale `http://localhost:3000` or `http://localhost:5173` entries from
the production Site URL setting. Keep localhost only as an additional redirect
URL for local development.

For local development, also add:

```text
http://localhost:5173/auth
```

For the OAuth providers, use Supabase's callback endpoint, not the frontend
callback URL. In GitHub OAuth App settings, set the Authorization callback URL
to:

```text
https://nloprkmmfsiawhlasxdw.supabase.co/auth/v1/callback
```

The GitHub account must have a verified `@vignan.ac.in` email address. The
frontend requests the GitHub `read:user user:email` scopes so Supabase can read
that address. In the GitHub OAuth App, set the Homepage URL to the deployed
frontend origin and ensure the app uses the callback URL above.

In Microsoft Entra ID, add the same URL as a Web redirect URI. In Supabase,
enable the GitHub and Azure providers and configure each provider's client ID
and secret. The provider then returns to Supabase, and Supabase redirects the
user back to the deployed `/auth` URL above.
