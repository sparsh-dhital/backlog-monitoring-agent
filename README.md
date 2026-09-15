# backlog-monitoring-agent

AI-powered agent for monitoring student backlogs, assessing academic risk, and recommending timely interventions.

## Login setup

- Users sign in with their registration number and a one-time code. `POST /api/auth/request-otp` generates a random 6-digit code and prints it in the backend terminal (no SMS gateway is wired up yet); `POST /api/auth/verify-otp` checks it and returns a signed session token. Codes expire after 5 minutes, allow 5 attempts, and can be re-requested after 30 seconds. Set `AUTH_SESSION_SECRET` in `backend/.env` so sessions survive a backend restart.
- The login screen also has a role-specific demo login for hackathon presentations. It uses `X-Demo-Role` and is accepted only when `DEMO_LOGIN_ENABLED=true` on the backend.
- GitHub and Microsoft 365 sign-in is limited to `@vignan.ac.in` accounts: the login page signs other accounts out and the API rejects their tokens. Override the domain with `ALLOWED_EMAIL_DOMAIN` (backend) and `VITE_ALLOWED_EMAIL_DOMAIN` (frontend).
- If a `profiles` table with `registration_number` and `role` columns exists (or the table named by `REGISTRATION_TABLE`), codes are issued only for numbers registered under the chosen role. Without that table any well-formed number is accepted, and the printed code is the only check.
- Add the backend URL to `VITE_API_URL` in the frontend environment.
