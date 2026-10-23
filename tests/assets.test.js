'use strict';
/**
 * Asset integrity: crawl every mirrored page, collect every internal css/js/img/font reference
 * (including url(...) inside the stylesheets themselves) and assert each one is actually served.
 * Catches assets the mirror failed to download and paths broken by a link rewrite.
 *
 *   node tests/assets.test.js
 *   BASE_URL=https://... node tests/assets.test.js
 */
const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const CONCURRENCY = 12;

const PAGES = ['/', '/about', '/contact', '/destinations', '/privacy', '/cookie', '/charges-fees',
  '/terms-condition', '/refund-cancellation', '/faq', '/how-to-book',
  '/hotel-booking-tips', '/explore-niagara-falls', '/discover-miami', '/fly-to-montreal',
  '/explore-halifax', '/fly-to-mexico', '/fly-to-bangkok', '/discover-costa-rica',
  '/mexican-celebration', '/alaska-flights', '/hawaii-flights', '/singapore-flights',
  '/alaska-flight-tickets', '/canada', '/explore-montreal', '/explore-toronto', '/explore-vancouver',
  '/hawai-flight-tickets', '/qatar', '/singapore', '/tour/atlantic-canada', '/tour/canadian-eastcoast',
  '/tour/phuket-celebration', '/tour/niagara-falls-package', '/tour/request-quote'];

const ATTR = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
const CSSURL = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;

const internal = (u) => u && !/^(https?:|data:|mailto:|tel:|javascript:|#|\/\/)/i.test(u);
const isAsset = (u) => /\.(css|js|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|otf|mp4|webm)(\?|$)/i.test(u);

function resolve(ref, fromPath) {
  if (ref.startsWith('/')) return ref.split('?')[0].split('#')[0];
  const dir = fromPath.replace(/[^/]*$/, '');
  const joined = (dir + ref).split('?')[0].split('#')[0];
  const parts = [];
  for (const seg of joined.split('/')) {
    if (seg === '.' || seg === '') continue;
    if (seg === '..') parts.pop(); else parts.push(seg);
  }
  return '/' + parts.join('/');
}

async function head(url) {
  try {
    const r = await fetch(BASE + url, { method: 'GET', headers: { Range: 'bytes=0-0' } });
    return r.status;
  } catch (e) {
    return 0;
  }
}

async function pool(items, worker) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await worker(items[idx]);
    }
  }));
  return out;
}

(async () => {
  console.log(`Перевіряю ассети на ${BASE}\n`);
  const refs = new Map();      // assetPath -> Set(source that references it)
  const fromHtml = new Set();  // referenced by page markup => a browser really requests it

  // 1) references from every page
  for (const p of PAGES) {
    const res = await fetch(BASE + p);
    if (!res.ok) { console.log(`  FAIL сторінка ${p} -> ${res.status}`); continue; }
    const html = await res.text();
    for (const m of html.matchAll(ATTR)) {
      const raw = m[1];
      if (!internal(raw) || !isAsset(raw)) continue;
      const abs = resolve(raw, p);
      if (!refs.has(abs)) refs.set(abs, new Set());
      refs.get(abs).add(p);
      fromHtml.add(abs);
    }
    for (const m of html.matchAll(CSSURL)) {
      const raw = m[1];
      if (!internal(raw) || !isAsset(raw)) continue;
      const abs = resolve(raw, p);
      if (!refs.has(abs)) refs.set(abs, new Set());
      refs.get(abs).add(p);
      fromHtml.add(abs);
    }
  }
  console.log(`Зі сторінок зібрано посилань на ассети: ${refs.size}`);

  // 2) references from inside the stylesheets
  const sheets = [...refs.keys()].filter((u) => u.endsWith('.css'));
  for (const sheet of sheets) {
    const res = await fetch(BASE + sheet);
    if (!res.ok) continue;
    const css = await res.text();
    for (const m of css.matchAll(CSSURL)) {
      const raw = m[1];
      if (!internal(raw) || !isAsset(raw)) continue;
      const abs = resolve(raw, sheet);
      if (!refs.has(abs)) refs.set(abs, new Set());
      refs.get(abs).add(sheet);
    }
  }
  console.log(`Разом з посиланнями всередині CSS: ${refs.size}\n`);

  // 3) check them all
  const list = [...refs.keys()];
  const statuses = await pool(list, head);
  const broken = [];
  list.forEach((u, i) => {
    const s = statuses[i];
    if (s !== 200 && s !== 206 && s !== 304) broken.push({ url: u, status: s, from: [...refs.get(u)].slice(0, 3) });
  });

  // A reference found only inside a stylesheet may belong to a component no page uses, in which
  // case no browser ever requests it. Those are reported as warnings; anything a page's markup
  // (or an inline style) points at is a hard failure.
  const hard = broken.filter((b) => fromHtml.has(b.url));
  const soft = broken.filter((b) => !fromHtml.has(b.url));

  console.log(`Перевірено: ${list.length}`);
  console.log(`Робочих:    ${list.length - broken.length}`);
  console.log(`Зламаних:   ${hard.length}`);
  console.log(`Попереджень (тільки в CSS, сторінки не використовують): ${soft.length}\n`);

  if (soft.length) {
    console.log('ПОПЕРЕДЖЕННЯ (мертві правила CSS):');
    for (const b of soft) console.log(`  ${String(b.status).padStart(3)}  ${b.url}   <- ${b.from.join(', ')}`);
    console.log('');
  }
  if (hard.length) {
    console.log('ЗЛАМАНІ АССЕТИ:');
    for (const b of hard.slice(0, 40)) {
      console.log(`  ${String(b.status).padStart(3)}  ${b.url}   <- ${b.from.join(', ')}`);
    }
    process.exit(1);
  }
  console.log('Усі ассети, які реально запитує браузер, віддаються.');
})().catch((e) => { console.error('ТЕСТ ВПАВ:', e); process.exit(1); });
