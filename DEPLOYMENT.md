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

For local development, also add:

```text
http://localhost:5173/auth
```
