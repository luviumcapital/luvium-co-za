// POST /api/enquiry  JSON: name,email,phone,organisation,region,type,message,salesRange,regNumber,consent,website(honeypot)
// Env (names only): RESEND_API_KEY, MAIL_FROM, MAIL_TO (default admin@luviumcapital.com)
import { esc, clean, body, validEmail, guard } from './_lib.js';

export default async function handler(req, res) {
  if (!guard(req, res, 6)) return;
  const b = body(req);
  if (b.website) return res.status(200).json({ ok: true }); // honeypot: pretend success

  const d = {
    name: clean(b.name, 100),
    email: clean(b.email, 254),
    phone: clean(b.phone, 30),
    organisation: clean(b.organisation, 120),
    regNumber: clean(b.regNumber, 40),
    region: clean(b.region, 80),
    type: clean(b.type, 40),
    salesRange: clean(b.salesRange, 60),
    message: clean(b.message, 2000),
  };
  const subject = clean(b.subject, 120) || 'Enquiry from luvium.co.za';
  const fields = [];
  if (!d.name) fields.push('name');
  if (!validEmail(d.email)) fields.push('email');
  if (!(b.consent === true || b.consent === 'yes' || b.consent === 'on')) fields.push('consent');
  if (fields.length) return res.status(422).json({ error: 'invalid', message: 'Please check the highlighted fields.', fields });

  const key = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.MAIL_FROM || '').trim();
  if (!key || !from) return res.status(503).json({ error: 'not_configured' });
  const to = String(process.env.MAIL_TO || '').trim() || 'admin@luviumcapital.com';

  const rows = Object.entries(d).filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  const html = `<table>${rows}</table>`;
  const text = Object.entries(d).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: d.email, subject, html, text }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return res.status(502).json({ error: 'upstream' });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: 'upstream' });
  }
}
