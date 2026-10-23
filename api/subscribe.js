// POST /api/subscribe  JSON: email, website(honeypot)
// Env (names only): BREVO_API_KEY, BREVO_LIST_ID
import { clean, body, validEmail, guard } from './_lib.js';

export default async function handler(req, res) {
  if (!guard(req, res, 6)) return;
  const b = body(req);
  if (b.website) return res.status(200).json({ ok: true });

  const email = clean(b.email, 254);
  if (!validEmail(email)) return res.status(422).json({ error: 'invalid', message: 'Enter a valid email address.', fields: ['email'] });

  const key = process.env.BREVO_API_KEY;
  const list = parseInt(process.env.BREVO_LIST_ID || '', 10);
  if (!key || !list) return res.status(503).json({ error: 'not_configured' });

  try {
    const r = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email, listIds: [list], updateEnabled: true }),
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok || r.status === 204) return res.status(200).json({ ok: true });
    return res.status(502).json({ error: 'upstream' });
  } catch (e) {
    return res.status(502).json({ error: 'upstream' });
  }
}
