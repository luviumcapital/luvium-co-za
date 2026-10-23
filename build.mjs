// Static page builder: wraps each src/pages/*.html body in the shared layout and writes the finished page to the project root.
// Run: node build.mjs     (no dependencies)
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const SITE = 'https://luvium.co.za';
const NAME = 'Luvium CAPITAL';

const icon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true"><use href="/img/icons.svg#i-${id}"/></svg>`;

const nav = `
<span id="top-sentinel" aria-hidden="true"></span>
<header class="nav">
  <div class="wrap nav-in">
    <a class="brand" href="/" aria-label="${NAME}, home">
      <span class="brand-mark">${icon('stack')}</span>
      <span><span class="brand-name">${NAME}</span><span class="brand-tag">Dealers Seamless Liquidity</span></span>
    </a>
    <div class="tools">
      <nav id="menu" class="menu" aria-label="Main">
        <a href="/">Home</a>
        <a href="/#why-us">Why Luvium</a>
        <a href="/#faq">FAQ</a>
        <a class="ghost" href="/login.html">Login</a>
        <a class="btn" href="/register.html">Get Started</a>
      </nav>
      <button id="theme-toggle" class="iconbtn theme" type="button" aria-label="Switch between light and dark theme" aria-pressed="false">${icon('sun', 'ico sun')}${icon('moon', 'ico moon')}</button>
      <button id="burger" class="iconbtn burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Open menu">${icon('list')}</button>
    </div>
  </div>
</header>`;

const footer = `
<footer class="foot">
  <div class="wrap foot-in">
    <div class="foot-brand">${icon('stack')}<span>Luvium Holdings</span></div>
    <p>&copy; 2026 Luvium Holdings (Pty) Ltd. All rights reserved.</p>
    <nav aria-label="Legal and contact">
      <a href="/privacy.html">Privacy</a>
      <a href="/terms.html">Terms</a>
      <a href="/contact.html">Contact</a>
    </nav>
  </div>
</footer>`;

function layout(meta, body) {
  const url = SITE + (meta.path === '/' ? '/' : meta.path);
  const robots = meta.robots ? `<meta name="robots" content="${meta.robots}">` : '';
  const canon = meta.robots && meta.robots.includes('noindex') ? '' : `<link rel="canonical" href="${url}">`;
  const og = meta.robots && meta.robots.includes('noindex') ? '' : `
<meta property="og:type" content="website">
<meta property="og:site_name" content="${NAME}">
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.desc}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="en_ZA">
<meta name="twitter:card" content="summary">`;
  const ld = (meta.jsonld || []).map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n');
  const bare = meta.bare === true;
  return `<!doctype html>
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${meta.title}</title>
<meta name="description" content="${meta.desc}">
${robots}
${canon}
<meta name="theme-color" content="#0b1120">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">${og}
<link rel="preload" href="/fonts/bricolage-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/figtree-400.woff2" as="font" type="font/woff2" crossorigin>
<script src="/js/boot.js"></script>
<link rel="stylesheet" href="/css/site.css">
${ld}
</head>
<body>
<div class="progress" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>
<a class="skip" href="#main">Skip to content</a>
${bare ? '' : nav}
<main id="main">
${body}
</main>
${bare ? '' : footer}
<script src="/js/site.js" defer></script>
</body>
</html>
`;
}

const dir = join(root, 'src', 'pages');
const pages = [];
for (const f of readdirSync(dir).filter(n => n.endsWith('.html'))) {
  let src = readFileSync(join(dir, f), 'utf8');
  const m = src.match(/^<!--(\{[\s\S]*?\})-->\s*/);
  if (!m) throw new Error(f + ': missing meta comment');
  const meta = JSON.parse(m[1]);
  src = src.slice(m[0].length);
  if (/—|–/.test(src + JSON.stringify(meta))) throw new Error(f + ': contains an em or en dash');
  const out = f === '404.html' ? '404.html' : f;
  writeFileSync(join(root, out), layout(meta, src));
  pages.push(meta);
  console.log('built', out);
}

// sitemap from indexable pages
const urls = pages.filter(p => !(p.robots || '').includes('noindex')).map(p => `  <url><loc>${SITE}${p.path}</loc></url>`).join('\n');
writeFileSync(join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log('built sitemap.xml');
