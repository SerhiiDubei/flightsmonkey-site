'use strict';
// Calls from the site (ТЗ 23.10.2026): Phone Only Deals banners, the call pop-up, the pinned
// call button, airline logos and reviews. Content lives in data/*.json so it can be edited
// without a developer; the phone number always comes from SITE_PHONE (one source).
const fs = require('fs');
const path = require('path');
const cfg = require('./config');
const { esc } = require('./util');

const DATA = path.join(cfg.root, 'data');

// Read on every render: an edit to the JSON shows up without a restart.
function readJson(name, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8')); } catch (_) { return fallback; }
}

function deals() {
  return readJson('phone-deals.json', { banners: { enabled: false, items: [] }, popup: { enabled: false }, sticky: {} });
}

function priceLabel(price) {
  return typeof price === 'number' && price > 0 ? `from $${Math.round(price)}` : 'Call for price';
}

/** Phone Only Deals block. variant: 'side' (desktop sidebar) | 'inline' (phones, above results). */
function dealsHtml(variant, phone, phoneDisplay) {
  const b = deals().banners || {};
  const items = (b.items || []).filter((i) => i && i.route);
  if (!b.enabled || !items.length) return '';
  const cards = items.map((i) => `
      <a class="pod-card" href="tel:${esc(phone)}" data-call-source="banner" data-call-number>
        <span class="pod-route">${esc(i.route)}</span>
        <span class="pod-note">${esc(i.note || '')}</span>
        <span class="pod-price">${esc(priceLabel(i.price))}</span>
        <span class="pod-cta"><i class="fa-solid fa-phone"></i> <span data-call-display>${esc(phoneDisplay)}</span></span>
      </a>`).join('');
  return `
<aside class="pod pod--${variant}" aria-label="${esc(b.title || 'Phone-only deals')}">
  <div class="pod-head">
    <strong>${esc(b.title || 'Phone-only deals')}</strong>
    ${b.subtitle ? `<span>${esc(b.subtitle)}</span>` : ''}
  </div>
  <div class="pod-list">${cards}
  </div>
</aside>`;
}

/** Settings the browser script needs: pop-up text and rules, analytics ids. JSON-safe for a <script> tag. */
function clientConfig(phone, phoneDisplay) {
  const d = deals();
  const conf = {
    phone,
    phoneDisplay,
    popup: d.popup || { enabled: false },
    adsCallConversion: cfg.analytics.adsCallConversion || '',
  };
  return JSON.stringify(conf).replace(/</g, '\\u003c');
}

const AIRLINES = [
  ['AA', 'American Airlines'], ['DL', 'Delta Air Lines'], ['UA', 'United Airlines'], ['WN', 'Southwest Airlines'],
  ['AS', 'Alaska Airlines'], ['B6', 'JetBlue'], ['AC', 'Air Canada'], ['WS', 'WestJet'],
  ['BA', 'British Airways'], ['LH', 'Lufthansa'], ['AF', 'Air France'], ['EK', 'Emirates'],
];

function airlinesHtml() {
  const logos = AIRLINES.map(([code, name]) =>
    `<li><img src="/assets/images/uploads/airlines-hd/${code}.png" alt="${esc(name)}" title="${esc(name)}" loading="lazy" width="64" height="64"></li>`).join('');
  return `
<section class="trust-airlines" aria-labelledby="trust-airlines-h">
  <div class="container">
    <h2 id="trust-airlines-h">Airlines we book</h2>
    <ul class="trust-airlines-list">${logos}</ul>
  </div>
</section>`;
}

/** Shown only when data/reviews.json has real reviews — an empty block is never rendered. */
function reviewsHtml() {
  const r = readJson('reviews.json', { items: [] });
  const items = (r.items || []).filter((i) => i && i.text && i.name);
  if (!items.length) return '';
  const cards = items.map((i) => {
    const n = Math.max(0, Math.min(5, Math.round(Number(i.rating) || 0)));
    const stars = n ? `<span class="trust-review-stars" aria-label="${n} out of 5">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>` : '';
    return `<figure class="trust-review">${stars}<blockquote>${esc(i.text)}</blockquote><figcaption>${esc(i.name)}${i.source ? ` · ${esc(i.source)}` : ''}</figcaption></figure>`;
  }).join('');
  return `
<section class="trust-reviews" aria-labelledby="trust-reviews-h">
  <div class="container">
    <h2 id="trust-reviews-h">${esc(r.title || 'What travellers say')}</h2>
    <div class="trust-reviews-list">${cards}</div>
  </div>
</section>`;
}

/** Tags added to every page: the calls stylesheet in <head>; GA4 (if set) and the calls script before </body>. */
function headTags() {
  return '<link href="/assets/css/calls.css?v=4" rel="stylesheet" />';
}

function bodyTags(phone, phoneDisplay) {
  const ga = cfg.analytics.ga4Id;
  const gaTags = ga ? `
<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(ga)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(ga)});</script>` : '';
  return `${gaTags}
<script id="fm-calls-config" type="application/json">${clientConfig(phone, phoneDisplay)}</script>
<script src="/assets/js/calls.js?v=1" defer></script>`;
}

module.exports = { deals, dealsHtml, airlinesHtml, reviewsHtml, headTags, bodyTags, priceLabel };
