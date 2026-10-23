'use strict';
// Stateless session: the whole session lives in one HMAC-signed cookie.
//
// Why not express-session: on Vercel every request may hit a different serverless instance,
// so its default MemoryStore loses the session immediately after the search redirect. The data
// we actually need to carry is tiny (the search query plus the chosen offer id), so signing it
// into a cookie removes the need for any shared server-side store.
const crypto = require('crypto');

const COOKIE = 'xf_s';
const MAX_AGE = 2 * 60 * 60; // seconds
const MAX_BYTES = 3500;      // stay well under the 4 KB per-cookie browser limit

const b64u = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

function sign(payload, secret) {
  return b64u(crypto.createHmac('sha256', secret).update(payload).digest());
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function read(req, secret) {
  const raw = parseCookies(req.headers.cookie)[COOKIE];
  if (!raw) return {};
  const dot = raw.lastIndexOf('.');
  if (dot < 0) return {};
  const body = raw.slice(0, dot);
  const mac = raw.slice(dot + 1);
  const expected = sign(body, secret);
  // constant-time compare; lengths must match first or timingSafeEqual throws
  if (mac.length !== expected.length
    || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return {};
  try {
    const obj = JSON.parse(unb64u(body).toString('utf8'));
    if (!obj || typeof obj !== 'object') return {};
    if (obj.__exp && Date.now() > obj.__exp) return {};
    return obj;
  } catch (_) {
    return {};
  }
}

function serialize(sessionObj, secret, secure) {
  const obj = { ...sessionObj, __exp: Date.now() + MAX_AGE * 1000 };
  const body = b64u(Buffer.from(JSON.stringify(obj), 'utf8'));
  const value = `${body}.${sign(body, secret)}`;
  if (value.length > MAX_BYTES) throw new Error('session cookie too large');
  return `${COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

/** Express middleware exposing req.session, persisted to the cookie only when it changed. */
function middleware(secret) {
  return function sessionCookie(req, res, next) {
    req.session = read(req, secret);
    const before = JSON.stringify(req.session);
    const writeHead = res.writeHead;
    res.writeHead = function patched(...args) {
      try {
        if (JSON.stringify(req.session) !== before) {
          const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
          res.append('Set-Cookie', serialize(req.session, secret, secure));
        }
      } catch (err) {
        console.error('[session] could not persist cookie:', err.message);
      }
      return writeHead.apply(this, args);
    };
    next();
  };
}

module.exports = { middleware, read, serialize, COOKIE };
