# backlog-monitoring-agent

AI-powered agent for monitoring student backlogs, assessing academic risk, and recommending timely interventions.

## Login setup

- All users sign in with their registration number. The frontend looks up the number through `POST /api/auth/registration-phone`, then Supabase sends an SMS OTP to the stored phone number.
- The login screen also has a role-specific demo login for hackathon presentations. It uses `X-Demo-Role` and is accepted only when `DEMO_LOGIN_ENABLED=true` on the backend.
- Enable Supabase **Authentication → Providers → Phone** and configure an SMS provider.
- The default lookup table is `profiles` with `registration_number`, `role` (`student`, `mentor`, `hod`, `exam`, or `placement`), and `phone` columns. Set `REGISTRATION_TABLE` if the table has another name.
- Add the backend URL to `VITE_API_URL` in the frontend environment.
