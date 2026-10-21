// POST /api/contact  -> validates, emails the enquiry via Resend. Stores nothing.
// Fields: name, email, company (optional), type (optional), message, website (HONEYPOT, must be empty), cf-turnstile-response (optional)
import { rateLimited, clean, isEmail, esc, clientIp, readBody, turnstileOk } from "./_lib.js";

export default async function handler(req, res, deps = {}) {
  const fetchImpl = deps.fetch || fetch;
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });

  const ip = clientIp(req);
  if (rateLimited(ip)) return res.status(429).json({ ok: false, error: "too_many_requests" });

  const b = await readBody(req);
  if (clean(b.website)) return res.status(200).json({ ok: true }); // honeypot filled: pretend success, send nothing

  const name = clean(b.name, 120);
  const email = clean(b.email, 254);
  const company = clean(b.company, 160);
  const type = clean(b.type, 60);
  const message = clean(b.message, 4000);
  if (!name || !isEmail(email) || message.length < 10) {
    return res.status(400).json({ ok: false, error: "invalid_input" });
  }
  if (!(await turnstileOk(b["cf-turnstile-response"], ip, fetchImpl))) {
    return res.status(400).json({ ok: false, error: "spam_check_failed" });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(500).json({ ok: false, error: "not_configured" });

  const to = process.env.CONTACT_TO || "admin@luviumcapital.com";
  const from = process.env.CONTACT_FROM || "Luvium Capital <noreply@luviumcapital.com>";
  const html =
    `<p><b>New website enquiry</b></p><p>Name: ${esc(name)}<br>Email: ${esc(email)}<br>` +
    `Company: ${esc(company || "-")}<br>Type: ${esc(type || "-")}</p><p>${esc(message).replace(/\n/g, "<br>")}</p>`;

  const r = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [to], reply_to: email, subject: `Website enquiry from ${name}`, html }),
  });
  if (!r.ok) return res.status(502).json({ ok: false, error: "send_failed" });
  return res.status(200).json({ ok: true });
}
