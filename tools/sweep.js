'use strict';
/**
 * Every page, both widths, all the signals that caught a real bug here.
 *
 *   npm install --no-save puppeteer
 *   node tools/sweep.js                     -> against http://localhost:3000
 *   BASE_URL=https://... node tools/sweep.js
 *   node tools/sweep.js --page /faq         -> one page, with the offenders listed
 *
 * Why these six checks and not others: each one is a fault that actually
 * shipped, and that the checks in place at the time could not see.
 *
 *   overflow   an element past the viewport edge
 *   burst      a child outside the box that is supposed to contain it
 *   oversized  an image or icon over 110px that nothing sized — the 268px
 *              sort GIFs and the 330px close cross on the results page
 *   serif      body content set in the display face at heading size: this
 *              markup puts fares and filter labels in <h2>/<h3>, so they
 *              inherited the page-title clamp. 41.6px prices came from this
 *   ghost      an element in normal flow with opacity 0 and real height —
 *              the invisible 1196px modal that emptied the booking page
 *   bare       a form field nothing styled: either the browser's grey box
 *              (the quote form), or no box at all — the search card's
 *              transparent .form-control reaching the contact form, whose
 *              inputs printed as loose placeholder text. Neither overflows,
 *              so containment passed both pages for a whole release.
 * There was a seventh check here — "elements no selector in app.css
 * matches" — and it is gone because it did not work. Iterating the
 * stylesheets returned nothing on at least one run, and with no selectors
 * collected every element counts as uncovered, so the figures it produced
 * (2,813, then 7,832) measured the bug in the check rather than the state
 * of the pages. A number nobody can stand behind is worse than no number.
 *
 * Containment (the first two) was the only thing measured for a long time,
 * and it is exactly the set of checks a permanently-open transparent panel
 * inside its own field passes.
 */
const puppeteer = require('puppeteer');

const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const ONLY = (() => { const i = process.argv.indexOf('--page'); return i > -1 ? process.argv[i + 1] : null; })();

/** The search form, filled and submitted — the only way to reach the
 *  results and booking pages, which render an empty shell without it. */
const SEARCH = `(() => { const f = document.getElementById('searchbox'); if (!f) return;
  const set = (n, v) => { let e = f.querySelector('[name="' + n + '"]');
    if (!e) { e = document.createElement('input'); e.type = 'hidden'; e.name = n; f.appendChild(e); } e.value = v; };
  set('origin','YYZ'); set('destination','YVR'); set('from_air','YYZ'); set('dest_air','YVR');
  set('depart_date','11/15/2026'); set('return_date','11/22/2026');
  set('dp_date','2026-11-15'); set('ar_date','2026-11-22');
  set('adult','1'); set('child','0'); set('infant','0');
  set('class_air','Economy'); set('class_type','Economy'); set('triptype','round');
  f.submit(); })()`;

const PAGES = [
  '/', '/about', '/contact', '/faq', '/destinations', '/how-to-book', '/hotel-booking-tips',
  '/charges-fees', '/privacy', '/cookie', '/terms-condition', '/refund-cancellation',
  '/canada', '/singapore', '/qatar',
  '/alaska-flights', '/alaska-flight-tickets', '/hawaii-flights', '/hawai-flight-tickets', '/singapore-flights',
  '/explore-toronto', '/explore-vancouver', '/explore-montreal', '/explore-halifax', '/explore-niagara-falls',
  '/discover-miami', '/discover-costa-rica', '/fly-to-bangkok', '/fly-to-mexico', '/fly-to-montreal',
  '/mexican-celebration',
  '/tour/atlantic-canada', '/tour/canadian-eastcoast', '/tour/niagara-falls-package',
  '/tour/phuket-celebration', '/tour/request-quote',
  { path: '/', name: '/airline/searchflight', search: true },
  { path: '/', name: '/airline/booking', search: true, pickFare: true },
];

const VIEWPORTS = [
  { tag: 'desktop', width: 1440, height: 900, mobile: false },
  { tag: 'mobile',  width: 390,  height: 844, mobile: true },
];

const AUDIT = () => {
  const vw = document.documentElement.clientWidth;
  const name = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
    (el.className && typeof el.className === 'string'
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');

  const shown = (el) => {
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  };
  const all = [...document.querySelectorAll('body *')].filter(shown);

  const overflow = [], burst = [], oversized = [], serif = [], ghost = [], bare = [];

  for (const el of all) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;

    if (cs.position !== 'fixed' && (r.right > vw + 1 || r.left < -1)) overflow.push(name(el));

    const p = el.parentElement;
    if (p && p !== document.body && cs.position !== 'absolute') {
      const pcs = getComputedStyle(p);
      if (pcs.overflow === 'visible' && pcs.position !== 'absolute') {
        const b = p.getBoundingClientRect();
        if (b.width && (r.right > b.right + 2 || r.left < b.left - 2)) burst.push(name(el) + ' > ' + name(p));
      }
    }

    // An icon drawn far larger than it was authored for. A photograph at
    // 358px is fine; a 14x2 rule stretched to a 14x14 block, or a 48px
    // sprite painted at 268px, is not. Compare against the natural size.
    if (el.tagName === 'IMG' && el.naturalWidth) {
      const blownUp = r.width > el.naturalWidth * 1.6 && r.width > 40;
      const iconGrown = el.naturalWidth <= 64 && r.width > 90;
      if (blownUp || iconGrown) {
        oversized.push((el.getAttribute('src') || '').split('/').pop().slice(0, 24) +
                       ' ' + el.naturalWidth + 'x' + el.naturalHeight + ' -> ' +
                       Math.round(r.width) + 'x' + Math.round(r.height));
      }
    }
    if (/^(SVG|I)$/.test(el.tagName) && r.width > 110) {
      oversized.push((el.className + '').slice(0, 24) + ' ' + Math.round(r.width));
    }

    // Body content typeset as a page title. A real <h1>/<h2> at 26px is a
    // heading doing its job; a <p>, <td>, <span> or <label> at that size is
    // markup that put data in the wrong element and inherited the clamp —
    // which is how fares printed at 41.6px on the results page.
    // Body content typeset as a page title. A real <h1>/<h2> at 26px is a
    // heading doing its job. A <p>, <td>, <span> or <a> at that size is
    // usually markup that put data in the wrong element and inherited the
    // heading clamp — that is how fares printed at 41.6px on the results
    // page. But not always: #hfourbd on the booking page and the phone
    // number on the home page are sized that large on purpose. An element
    // an id or a named class points at was a decision, so leave it alone.
    if (!el.children.length && parseFloat(cs.fontSize) > 24 && /Fraunces/i.test(cs.fontFamily)
        && !/^H[1-3]$/.test(el.tagName) && !el.closest('h1, h2, h3')
        && !el.id && !el.closest('.brandmark, .phone-number, [id]')) {
      const t = (el.textContent || '').trim();
      if (t) serif.push(el.tagName.toLowerCase() + ' "' + t.slice(0, 20) + '" @' + cs.fontSize);
    }

    if (cs.opacity === '0' && cs.position === 'static' && r.height > 80) ghost.push(name(el) + ' h=' + Math.round(r.height));

    // Inside the search card's .textlng the wrapper draws the box and the
    // input is transparent on purpose, so only fields outside it count.
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !/^(hidden|checkbox|radio|submit|button)$/.test(el.type)
        && !el.closest('.textlng')) {
      const uaGrey = /^rgb\((118|133|169), \1, \1\)$/.test(cs.borderTopColor) || cs.borderTopStyle === 'inset';
      const noBox = parseFloat(cs.borderTopWidth) === 0 && /^(transparent|rgba\(0, 0, 0, 0\))$/.test(cs.backgroundColor);
      if (uaGrey || noBox) bare.push((el.name || el.id || el.tagName.toLowerCase()) + (uaGrey ? ' (браузерна)' : ' (без рамки)'));
    }
  }

  const uniq = (a) => [...new Set(a)];
  return {
    scrollW: document.documentElement.scrollWidth, vw,
    overflow: overflow.length, burst: burst.length,
    oversized: uniq(oversized), serif: uniq(serif), ghost: uniq(ghost), bare: uniq(bare),
    samples: { overflow: uniq(overflow).slice(0, 4), burst: uniq(burst).slice(0, 4) },
  };
};

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const list = ONLY ? [ONLY] : PAGES;
  const rows = [];

  for (const vp of VIEWPORTS) {
    for (const entry of list) {
      const spec = typeof entry === 'string' ? { path: entry, name: entry } : entry;
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.mobile, hasTouch: vp.mobile });
      let res = null, err = null;
      try {
        await page.goto(BASE + spec.path, { waitUntil: 'networkidle2', timeout: 45000 });
        await page.evaluate(() => { const x = document.getElementById('closebvtn'); if (x) x.click();
                                    const o = document.querySelector('.overllllay'); if (o) o.style.display = 'none'; });
        if (spec.search) {
          await page.evaluate(SEARCH);
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
          await new Promise((r) => setTimeout(r, 4500));
          if (spec.pickFare) {
            await page.evaluate(() => { const f = document.querySelector('form.all'); if (f) f.submit(); });
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
            await new Promise((r) => setTimeout(r, 2500));
          }
        }
        await page.evaluate(() => { document.querySelectorAll('.will-reveal').forEach((el) => {
          el.classList.add('is-revealed'); el.style.transition = 'none'; }); });
        await new Promise((r) => setTimeout(r, 250));
        res = await page.evaluate(AUDIT);
      } catch (e) { err = e.message.split('\n')[0].slice(0, 44); }
      await page.close();
      rows.push({ vp: vp.tag, name: spec.name, res, err });
    }
  }
  await browser.close();

  const score = (r) => !r ? 999 : r.overflow + r.burst + r.oversized.length * 2 + r.serif.length * 2 + r.ghost.length * 5
                              + r.bare.length * 2 + (r.scrollW > r.vw + 1 ? 10 : 0);

  for (const vp of VIEWPORTS) {
    const mine = rows.filter((r) => r.vp === vp.tag).sort((a, b) => score(b.res) - score(a.res));
    console.log(`\n${'='.repeat(78)}\n  ${vp.tag.toUpperCase()}  ${vp.width}px\n${'='.repeat(78)}`);
    console.log('  стор.'.padEnd(32) + 'overf burst  ікон сериф привид  поле');
    for (const row of mine) {
      if (row.err) { console.log('  ' + row.name.padEnd(30) + ' ПОМИЛКА ' + row.err); continue; }
      const r = row.res;
      const flag = score(r) > 0 ? ' <<' : '';
      console.log('  ' + row.name.padEnd(30) +
        String(r.overflow).padStart(5) + String(r.burst).padStart(6) +
        String(r.oversized.length).padStart(6) + String(r.serif.length).padStart(6) +
        String(r.ghost.length).padStart(7) + String(r.bare.length).padStart(6) + flag);
    }
    const bad = mine.filter((r) => r.res && score(r.res) > 0);
    if (bad.length) {
      console.log(`\n  ── деталі (${bad.length}) ──`);
      for (const row of bad) {
        const r = row.res;
        const bits = [];
        if (r.scrollW > r.vw + 1) bits.push(`гориз. прокрутка ${r.scrollW}>${r.vw}`);
        if (r.samples.overflow.length) bits.push('за екран: ' + r.samples.overflow.join(', '));
        if (r.samples.burst.length) bits.push('за батька: ' + r.samples.burst.join(', '));
        if (r.oversized.length) bits.push('великі: ' + r.oversized.slice(0, 3).join(', '));
        if (r.serif.length) bits.push('сериф: ' + r.serif.slice(0, 3).join(' | '));
        if (r.ghost.length) bits.push('привиди: ' + r.ghost.slice(0, 3).join(', '));
        if (r.bare.length) bits.push('голі поля: ' + r.bare.slice(0, 4).join(', '));
        console.log(`  ${row.name}\n      ${bits.join('\n      ')}`);
      }
    }
  }

  const clean = rows.filter((r) => r.res && score(r.res) === 0).length;
  console.log(`\n${'='.repeat(78)}`);
  console.log(`  чистих: ${clean} з ${rows.length} перевірок`);
  console.log('='.repeat(78));
})();
