# luvium.co.za

Static site. Edit `src/pages/*.html`, run `node build.mjs`, deploy. No framework.

Forms POST JSON to Vercel functions in `/api`. Without env vars they return 503 and the page falls back to a mailto link.

Env var NAMES (set values in Vercel, never in the repo):

- RESEND_API_KEY
- MAIL_FROM (verified Resend sender)
- MAIL_TO (optional, default admin@luviumcapital.com)
- BREVO_API_KEY
- BREVO_LIST_ID (numeric)

Endpoints: POST /api/enquiry, POST /api/subscribe.
