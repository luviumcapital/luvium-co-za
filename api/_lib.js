// Shared helpers for the form endpoints. Env var NAMES only; values live in Vercel.
const hits = new Map();

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

export function ip(req) {
  const f = req.headers['x-forwarded-for'];
  return (f ? String(f).split(',')[0] : req.socket && req.socket.remoteAddress || 'x').trim();
}

export function limited(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

export function sameOrigin(req) {
  const o = req.headers.origin;
  if (!o) return true;
  try {
    const h = new URL(o).host;
    return h === req.headers.host || h === 'luvium.co.za' || h === 'www.luvium.co.za';
  } catch (e) {
    return false;
  }
}

export function body(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b && typeof b === 'object' ? b : {};
}

export function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;
}

export function guard(req, res, max) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); res.status(405).json({ error: 'method' }); return false; }
  if (!sameOrigin(req)) { res.status(403).json({ error: 'origin' }); return false; }
  if (limited(ip(req) + ':' + req.url, max, 10 * 60 * 1000)) { res.status(429).json({ error: 'rate' }); return false; }
  return true;
}
