// POST /api/subscribe -> adds the email to a Brevo list. Brevo stores and sends; we store nothing.
// Fields: email, website (HONEYPOT), cf-turnstile-response (optional)
import { rateLimited, clean, isEmail, clientIp, readBody, turnstileOk } from "./_lib.js";

export default async function handler(req, res, deps = {}) {
  const fetchImpl = deps.fetch || fetch;
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });

  const ip = clientIp(req);
  if (rateLimited(ip)) return res.status(429).json({ ok: false, error: "too_many_requests" });

  const b = await readBody(req);
  if (clean(b.website)) return res.status(200).json({ ok: true });

  const email = clean(b.email, 254).toLowerCase();
  if (!isEmail(email)) return res.status(400).json({ ok: false, error: "invalid_input" });
  if (!(await turnstileOk(b["cf-turnstile-response"], ip, fetchImpl))) {
    return res.status(400).json({ ok: false, error: "spam_check_failed" });
  }

  const key = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  if (!key || !listId) return res.status(500).json({ ok: false, error: "not_configured" });

  const r = await fetchImpl("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email, listIds: [listId], updateEnabled: true }),
  });
  if (r.ok) return res.status(200).json({ ok: true }); // Brevo: 201 created, 204 updated
  return res.status(502).json({ ok: false, error: "subscribe_failed" });
}
