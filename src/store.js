'use strict';
// Two things that must not assume a long-lived single process:
//
// 1. offer cache  — keyed by the SEARCH QUERY (not by session), so any serverless instance can
//    serve a request. A warm instance reuses the supplier response; a cold one re-runs the search
//    exactly once and every follow-up AJAX call (filters, sorting, load more) then hits the cache.
// 2. persistence  — writing leads/bookings to the project directory fails on a read-only
//    serverless filesystem, so we degrade to /tmp and always log the record.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const providers = require('./providers');

const MAX_ENTRIES = 40;
const TTL_MS = 30 * 60 * 1000;

const cache = new Map();          // queryHash -> { offers, at, provider }
const inflight = new Map();       // queryHash -> Promise (collapses the 3 parallel AJAX calls)

const hash = (q) => crypto.createHash('sha256').update(JSON.stringify(q)).digest('hex').slice(0, 24);

function prune() {
  const cutoff = Date.now() - TTL_MS;
  for (const [k, v] of cache) if (v.at < cutoff) cache.delete(k);
  while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
}

/** Run (or reuse) the supplier search for this query. One provider call per distinct search. */
async function getOffers(q) {
  const key = hash(q);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit;

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const offers = await providers.search(q);
      const entry = { offers, at: Date.now(), provider: providers.name };
      cache.set(key, entry);
      prune();
      return entry;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, promise);
  return promise;
}

/* ----------------------------------------------------------------- persistence */

const READ_ONLY_FS = /^(1|true)$/i.test(process.env.VERCEL || '')
  || /^(1|true)$/i.test(process.env.AWS_LAMBDA_FUNCTION_NAME ? '1' : '');

function writable(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Persist a record as JSON. Returns the path it landed on, or null when only logged.
 * On a serverless host the project directory is read-only, so this falls back to the OS temp
 * directory (ephemeral) and relies on the console line, which the platform captures in its logs.
 */
function saveRecord(dir, name, obj) {
  const targets = READ_ONLY_FS ? [] : [dir];
  targets.push(path.join(os.tmpdir(), 'flightsite', path.basename(dir)));
  for (const target of targets) {
    if (!writable(target)) continue;
    try {
      const fp = path.join(target, name);
      fs.writeFileSync(fp, JSON.stringify(obj, null, 2));
      return fp;
    } catch (_) { /* try the next target */ }
  }
  return null;
}

/**
 * Optional durable hand-off: set LEAD_WEBHOOK_URL to POST every lead/booking somewhere that
 * survives (a CRM, a Zapier/Make hook, your own endpoint). Fire-and-forget, never blocks a reply.
 */
function forward(kind, record) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return;
  Promise.resolve()
    .then(() => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, record }),
    }))
    .catch((err) => console.error('[webhook] failed:', err.message));
}

module.exports = { getOffers, saveRecord, forward, hash };
