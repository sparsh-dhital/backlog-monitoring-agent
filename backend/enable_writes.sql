-- Run this in the Supabase SQL editor to let the API write backlog records.
--
-- Why it is needed: backend/.env holds a *publishable* key (sb_publishable_...),
-- the same key the browser uses, so the API is subject to row-level security
-- exactly like an anonymous client. SELECT and DELETE policies already exist on
-- these tables; INSERT does not, so every create fails with
--   42501: new row violates row-level security policy
--
-- Two ways to fix it. Pick ONE.
--
-- ── Option A (recommended for a prototype): allow authenticated inserts ──────
-- Any signed-in user may insert. The API still enforces who may write what:
-- a student account is pinned to its own student_id by _target_student().

create policy "authenticated can insert backlogs"
  on public.backlogs for insert
  to authenticated
  with check (true);

-- The custom-feed path (POST /api/orchestrate/{id}) writes these two as well.
-- Include them only if you use that endpoint.

create policy "authenticated can insert results"
  on public.results for insert
  to authenticated
  with check (true);

create policy "authenticated can insert exam_registrations"
  on public.exam_registrations for insert
  to authenticated
  with check (true);


-- ── Option B: give the API a service-role key instead ────────────────────────
-- No SQL needed. In backend/.env replace
--   SUPABASE_KEY=sb_publishable_...
-- with the service_role (secret) key from
--   Supabase → Project Settings → API Keys
--
-- This bypasses RLS entirely, which is normal for a trusted server. Only do
-- this for the BACKEND. Never put a service-role key in frontend/.env — it is
-- shipped to the browser and would give every visitor full database access.
--
-- Note that backend/.env is gitignored but frontend/.env is committed to this
-- repo, so keep the two straight.


-- ── To verify after applying either option ───────────────────────────────────
-- The "Add backlog" button on the My backlogs tab should save instead of
-- returning "row-level security has no INSERT policy".
