'use strict';
// Small formatting helpers shared by the renderer and the providers.
// All flight times are *local* wall-clock times without a timezone (as suppliers return them),
// so arithmetic is done on "fake UTC" minutes and is only used for durations / layovers.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];

const pad2 = (n) => String(n).padStart(2, '0');

function parseLocal(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(iso || '');
  if (!m) return null;
  return { y: +m[1], mo: +m[2], d: +m[3], h: +(m[4] || 0), mi: +(m[5] || 0) };
}

function toMinutes(iso) {
  const p = parseLocal(iso);
  if (!p) return 0;
  return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi) / 60000;
}

function epochSeconds(iso) {
  return Math.round(toMinutes(iso) * 60);
}

function fmtTime(iso) {            // 2026-10-15T21:50:00 -> 09:50PM
  const p = parseLocal(iso);
  if (!p) return '';
  const h12 = p.h % 12 || 12;
  return pad2(h12) + ':' + pad2(p.mi) + (p.h < 12 ? 'AM' : 'PM');
}

function fmtDateLong(iso) {        // -> October 15, 2026
  const p = parseLocal(iso);
  return p ? `${MONTHS[p.mo - 1]} ${pad2(p.d)}, ${p.y}` : '';
}

function fmtDateDMY(iso) {         // -> 15/10/2026
  const p = parseLocal(iso);
  return p ? `${pad2(p.d)}/${pad2(p.mo)}/${p.y}` : '';
}

function fmtDateISO(iso) {         // -> 2026-10-15
  const p = parseLocal(iso);
  return p ? `${p.y}-${pad2(p.mo)}-${pad2(p.d)}` : '';
}

function fmtDur(min) {             // 379 -> 6h 19m
  min = Math.max(0, Math.round(min || 0));
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function isoDurToMin(s) {          // PT6H19M -> 379
  const m = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/.exec(s || '');
  if (!m) return 0;
  return (+m[1] || 0) * 1440 + (+m[2] || 0) * 60 + (+m[3] || 0);
}

/**
 * mm/dd/yyyy or mm/dd/yy -> YYYY-MM-DD.
 * The mirrored date picker formats with jQuery UI's 'mm/dd/y', which is a TWO-digit year
 * ("11/20/26"), so rejecting short years silently broke every search made through the calendar.
 */
function usToIso(us) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec((us || '').trim());
  if (!m) return '';
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  return `${year}-${pad2(m[1])}-${pad2(m[2])}`;
}

function isoToUs(iso) {            // 2026-10-15 -> 10/15/2026
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[2]}/${m[3]}/${m[1]}` : '';
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const money = (n) => round2(n).toFixed(2);

function titleCase(s) {
  return String(s || '').toLowerCase().replace(/(^|[\s\-/(])([a-z])/g, (m, p, c) => p + c.toUpperCase());
}

function stopsLabel(n) {
  return n === 0 ? 'Direct' : n === 1 ? '1 Stop' : `${n} Stops`;
}

module.exports = {
  pad2, parseLocal, toMinutes, epochSeconds, fmtTime, fmtDateLong, fmtDateDMY, fmtDateISO,
  fmtDur, isoDurToMin, usToIso, isoToUs, esc, round2, money, titleCase, stopsLabel,
};
