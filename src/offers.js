'use strict';
// Filtering / sorting / statistics over normalized offers.
// The original front-end (public/ajax + the inline script of the results page) sends the
// *complete* filter state with every request, so these helpers are stateless.
const { toMinutes, epochSeconds, round2 } = require('./util');
const data = require('./data');

// departure-time buttons in the sidebar ("00-06", "06-12", "12-18", "18-00")
const DEP_SLOTS = { '00-06': [0, 6], '06-12': [6, 12], '12-18': [12, 18], '18-00': [18, 24] };

const depHour = (o) => Number(o.itineraries[0].segments[0].departAt.slice(11, 13));
const totalDuration = (o) => o.itineraries.reduce((s, it) => s + it.duration, 0);
const maxStops = (o) => Math.max(...o.itineraries.map((it) => it.stops));
const firstDep = (o) => toMinutes(o.itineraries[0].segments[0].departAt);

const SORTERS = {
  price_asc: (a, b) => a.price.total - b.price.total,
  price_desc: (a, b) => b.price.total - a.price.total,
  cheapest: (a, b) => a.price.total - b.price.total,
  earliest: (a, b) => firstDep(a) - firstDep(b),
  fastest: (a, b) => totalDuration(a) - totalDuration(b),
};

function toList(v) {
  if (Array.isArray(v)) return v;
  if (v === undefined || v === null || v === '') return [];
  return [v];
}

function normalize(f = {}) {
  const airlines = toList(f.airlines).map((s) => String(s).trim().toUpperCase()).filter(Boolean);
  const stopsRaw = f.stops;
  const stops = stopsRaw === undefined || stopsRaw === null || stopsRaw === '' ? null : Number(stopsRaw);
  const dep = DEP_SLOTS[String(f.dep || '').trim()] ? String(f.dep).trim() : null;
  const num = (x) => (x === undefined || x === null || x === '' || Number.isNaN(Number(x)) ? null : Number(x));
  return {
    airlines,
    stops: Number.isFinite(stops) ? stops : null,
    dep,
    min: num(f.min),
    max: num(f.max),
    sort: SORTERS[f.sort] ? f.sort : 'price_asc',
  };
}

/** Apply filters + sort. Returns a new array. */
function apply(offers, filters) {
  const f = normalize(filters);
  const list = offers.filter((o) => {
    if (f.airlines.length && !f.airlines.includes(o.validatingAirline)) return false;
    if (f.stops !== null && maxStops(o) !== f.stops) return false;
    if (f.dep) {
      const [a, b] = DEP_SLOTS[f.dep];
      const h = depHour(o);
      if (!(h >= a && h < b)) return false;
    }
    if (f.min !== null && o.price.total < f.min - 0.005) return false;
    if (f.max !== null && o.price.total > f.max + 0.005) return false;
    return true;
  });
  return list.sort(SORTERS[f.sort]);
}

/** Map the original endpoint parameters (sortval / vc) to a sort key. */
function sortFromParams(p = {}) {
  const vc = String(p.vc || '');
  if (vc.startsWith('cheapest')) return 'cheapest';
  if (vc.startsWith('earliest')) return 'earliest';
  if (vc.startsWith('shortest')) return 'fastest';
  if (vc === 'HighPrice') return 'price_desc';
  if (vc === 'LowerPrice') return 'price_asc';
  return String(p.sortval || '2') === '1' ? 'price_desc' : 'price_asc';
}

/** Aggregates used by the filter sidebar and the Earliest / Cheapest / Fastest bar. */
function stats(offers) {
  if (!offers.length) {
    return { count: 0, min: 0, max: 0, airlines: [], stops: [], cheapest: null, earliest: null, fastest: null };
  }
  const prices = offers.map((o) => o.price.total);
  const airlines = new Map();
  const stops = new Set();
  let cheapest = offers[0], earliest = offers[0], fastest = offers[0];
  for (const o of offers) {
    const code = o.validatingAirline;
    const rec = airlines.get(code) || { code, name: data.airlineName(code, o.itineraries[0].segments[0].carrierName), count: 0 };
    rec.count++;
    airlines.set(code, rec);
    stops.add(maxStops(o));
    if (o.price.total < cheapest.price.total) cheapest = o;
    if (firstDep(o) < firstDep(earliest)) earliest = o;
    if (totalDuration(o) < totalDuration(fastest)) fastest = o;
  }
  return {
    count: offers.length,
    min: round2(Math.min(...prices)),
    max: round2(Math.max(...prices)),
    airlines: [...airlines.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    stops: [...stops].sort((a, b) => a - b),
    cheapest: { price: cheapest.price.total },
    earliest: { price: earliest.price.total, epoch: epochSeconds(earliest.itineraries[0].segments[0].departAt) },
    fastest: { price: fastest.price.total, minutes: totalDuration(fastest) },
  };
}

module.exports = { apply, stats, sortFromParams, normalize, DEP_SLOTS, totalDuration, maxStops };
