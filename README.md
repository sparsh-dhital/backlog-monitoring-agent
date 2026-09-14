# backlog-monitoring-agent

AI-powered agent for monitoring student backlogs, assessing academic risk, and recommending timely interventions.

## Login setup

- `@vignan.ac.in` accounts must use the Microsoft 365 or GitHub buttons. Email/password login is rejected for this domain.
- Students and teachers/mentors can use registration-number login. The frontend looks up the number through `POST /api/auth/registration-phone`, then Supabase sends an SMS OTP to the stored phone number.
- Enable Supabase **Authentication → Providers → Phone** and configure an SMS provider.
- The default lookup table is `profiles` with `registration_number`, `role` (`student` or `mentor`), and `phone` columns. Set `REGISTRATION_TABLE` if the table has another name.
- Add the backend URL to `VITE_API_URL` in the frontend environment.
