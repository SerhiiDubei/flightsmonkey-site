'use strict';
// Loads the mirrored HTML pages from /pages and fills {{PLACEHOLDERS}} in the template pages
// (airline/searchflight.html, airline/booking.html, airline/returnbooking.html, airline/thankyou.html).
const fs = require('fs');
const path = require('path');
const cfg = require('./config');

const cache = new Map();
const PROD = process.env.NODE_ENV === 'production';

function pagePath(rel) {
  const safe = rel.replace(/\\/g, '/').replace(/\.\./g, '');
  return path.join(cfg.pagesDir, ...safe.split('/'));
}

function exists(rel) {
  try { return fs.statSync(pagePath(rel)).isFile(); } catch (_) { return false; }
}

function load(rel) {
  const fp = pagePath(rel);
  if (PROD && cache.has(fp)) return cache.get(fp);
  const html = fs.readFileSync(fp, 'utf8');
  cache.set(fp, html);
  return html;
}

function fill(tpl, vars) {
  // digits allowed: SITE_PHONE_2 / SITE_PHONE_3 are real keys
  return tpl.replace(/\{\{([A-Z0-9_]+)\}\}/g, (m, key) => (key in vars ? String(vars[key]) : ''));
}

/**
 * Brand placeholders available on every page. Merged under the caller's own vars
 * so a template can still override one if it ever needs to.
 */
/** +18444555252 -> 1-844-455-5252; anything that is not a NANP number is left alone. */
function prettyPhone(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  return d.length === 11 && d.startsWith('1')
    ? `1-${d.slice(1, 4)}-${d.slice(4, 7)}-${d.slice(7)}`
    : String(raw || '');
}

function brandVars() {
  const s = cfg.site;
  return {
    SITE_NAME: s.name,
    SITE_LEGAL: s.legal,
    SITE_DOMAIN: s.domain,
    SITE_URL: s.url,
    SITE_EMAIL: s.email,
    SITE_ADDRESS: s.address,
    SITE_EIN: s.ein,
    SITE_PHONE: s.phone,
    SITE_PHONE_ALT: s.phoneAlt,
    SITE_PHONE_2: s.phone2,
    SITE_PHONE_3: s.phone3,
    SITE_PHONE_DISPLAY: prettyPhone(s.phone),
    SITE_PHONE_ALT_DISPLAY: prettyPhone(s.phoneAlt),
    YEAR: String(new Date().getFullYear()),
  };
}

function render(rel, vars) {
  return fill(load(rel), { ...brandVars(), ...vars });
}

/** every mirrored static page (for the sitemap and the router) */
function staticPages() {
  const out = [];
  const walk = (dir, prefix) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.isDirectory()) { if (ent.name !== 'airline') walk(path.join(dir, ent.name), prefix + ent.name + '/'); continue; }
      if (ent.name.endsWith('.html')) out.push(prefix + ent.name.replace(/\.html$/, ''));
    }
  };
  walk(cfg.pagesDir, '/');
  return out.map((p) => (p === '/index' ? '/' : p));
}

module.exports = { load, fill, render, exists, pagePath, staticPages, brandVars };
