'use strict';
// TripJack B2B flight API adapter (the supplier the reference site books through:
// its booking script reads `tripInfos[0].totalPriceList[0].fd.ADULT.fC.TF / 61.43`).
//
//   POST {base}/fms/v1/air-search-all   header apikey   -> searchResult.tripInfos.{ONWARD|RETURN|COMBO}[]
//   POST {base}/fms/v1/review           { priceIds }    -> tripInfos, totalPriceInfo, bookingId
//   POST {base}/oms/v1/air/book         { bookingId, travellerInfo, deliveryInfo, paymentInfos }
//
// TripJack is a partner-only API (no self-service signup). Field names below follow TripJack's
// public integration docs; validate them against the documentation bundle you receive with your key.
const cfg = require('../config');
const data = require('../data');
const { toMinutes, round2 } = require('../util');

async function call(path, body) {
  if (!cfg.tripjack.apiKey) throw new Error('TRIPJACK_API_KEY is not set (see .env.example)');
  const res = await fetch(cfg.tripjack.baseUrl + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: cfg.tripjack.apiKey },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) { /* not json */ }
  if (!res.ok || (json && json.status && json.status.success === false)) {
    const err = json && json.errors ? JSON.stringify(json.errors) : text.slice(0, 500);
    throw new Error(`TripJack ${path} -> ${res.status} ${err}`);
  }
  return json;
}

// INR -> site currency (the original site hard-codes the divisor)
const fx = (inr) => round2(cfg.currency === 'INR' ? inr : inr / cfg.tripjack.fxDivisor);

/** @param {import('./index').SearchQuery} q */
async function search(q) {
  const routeInfos = [{
    fromCityOrAirport: { code: q.origin },
    toCityOrAirport: { code: q.destination },
    travelDate: q.departDate,
  }];
  if (q.tripType === 'round') {
    routeInfos.push({
      fromCityOrAirport: { code: q.destination },
      toCityOrAirport: { code: q.origin },
      travelDate: q.returnDate,
    });
  }
  const body = {
    searchQuery: {
      cabinClass: q.cabin,
      paxInfo: { ADULT: String(q.adults), CHILD: String(q.children), INFANT: String(q.infants) },
      routeInfos,
      searchModifiers: { isDirectFlight: !!q.nonStop, isConnectingFlight: false },
      ...(q.airline ? { preferredAirline: [{ code: q.airline }] } : {}),
    },
  };
  const res = await call('/fms/v1/air-search-all', body);
  const trips = (res.searchResult && res.searchResult.tripInfos) || {};
  const offers = [];
  if (Array.isArray(trips.COMBO) && trips.COMBO.length) {
    trips.COMBO.forEach((t, i) => offers.push(fromTrips([t], q, `combo${i}`, true)));
  } else if (Array.isArray(trips.ONWARD) && Array.isArray(trips.RETURN) && q.tripType === 'round') {
    // domestic round trips come back as two independent lists: pair the cheapest ones
    const on = trips.ONWARD.slice(0, 20), ret = trips.RETURN.slice(0, 20);
    on.forEach((a, i) => ret.forEach((b, j) => offers.push(fromTrips([a, b], q, `pair${i}_${j}`, false))));
  } else if (Array.isArray(trips.ONWARD)) {
    trips.ONWARD.forEach((t, i) => offers.push(fromTrips([t], q, `on${i}`, false)));
  }
  return offers.filter(Boolean).sort((a, b) => a.price.total - b.price.total);
}

function segment(s, q) {
  const fd = s.fD || {};
  const code = (fd.aI || {}).code || '';
  const da = s.da || {}, aa = s.aa || {};
  return {
    carrier: code,
    carrierName: data.airlineName(code, (fd.aI || {}).name),
    operatingCarrier: code,
    flightNumber: fd.fN || '',
    aircraft: fd.eT || '',
    from: { code: da.code || '', terminal: da.terminal || '' },
    to: { code: aa.code || '', terminal: aa.terminal || '' },
    departAt: s.dt,
    arriveAt: s.at,
    duration: Number(s.duration) || Math.max(0, toMinutes(s.at) - toMinutes(s.dt)),
    cabin: q.cabin,
    bookingClass: '',
    bags: '',
  };
}

function fromTrips(trips, q, key, combo) {
  const priceIds = [];
  let totalInr = 0, perAdultInr = 0, perChildInr = 0, perInfantInr = 0, seats = Infinity;
  const legs = [];
  for (const t of trips) {
    const pl = (t.totalPriceList || [])[0];
    if (!pl) return null;
    priceIds.push(pl.id);
    const fd = pl.fd || {};
    const a = ((fd.ADULT || {}).fC || {}).TF || 0;
    const c = ((fd.CHILD || {}).fC || {}).TF || 0;
    const i = ((fd.INFANT || {}).fC || {}).TF || 0;
    perAdultInr += a; perChildInr += c; perInfantInr += i;
    totalInr += a * q.adults + c * q.children + i * q.infants;
    const sr = Number((fd.ADULT || {}).sR);
    if (sr) seats = Math.min(seats, sr);
    const bags = ((fd.ADULT || {}).bI || {}).iB || '';
    const cls = (fd.ADULT || {}).cB || '';
    const raw = t.sI || [];
    const segs = raw.map((s) => ({ ...segment(s, q), bags, bookingClass: cls }));
    if (combo && raw.some((s) => s.isRs)) {
      // international round trips come back as one segment list; return legs are flagged isRs
      const out = [], back = [];
      raw.forEach((s, idx) => (s.isRs ? back : out).push(segs[idx]));
      if (out.length) legs.push(out);
      if (back.length) legs.push(back);
    } else {
      legs.push(segs);
    }
  }
  const itineraries = legs.filter((s) => s.length).map((segments) => ({
    duration: segments.reduce((sum, s) => sum + s.duration, 0) + layovers(segments),
    stops: Math.max(0, segments.length - 1),
    segments,
  }));
  if (!itineraries.length || !itineraries[0].segments.length) return null;
  const total = fx(totalInr);
  return {
    id: `tripjack:${key}`,
    provider: 'tripjack',
    currency: cfg.currency,
    price: {
      total, base: total, taxes: 0,
      perAdult: fx(perAdultInr), perChild: fx(perChildInr), perInfant: fx(perInfantInr),
    },
    seats: seats === Infinity ? 0 : seats,
    validatingAirline: itineraries[0].segments[0].carrier,
    itineraries,
    raw: { priceIds },
  };
}

function layovers(segments) {
  let sum = 0;
  for (let i = 1; i < segments.length; i++) {
    sum += Math.max(0, toMinutes(segments[i].departAt) - toMinutes(segments[i - 1].arriveAt));
  }
  return sum;
}

/** Re-validate the fare (TripJack "review"); returns the confirmed total and the bookingId. */
async function price(offer) {
  const res = await call('/fms/v1/review', { priceIds: offer.raw.priceIds });
  const tf = (((res.totalPriceInfo || {}).totalFareDetail || {}).fC || {}).TF;
  return {
    total: tf != null ? fx(tf) : offer.price.total,
    base: offer.price.base,
    currency: cfg.currency,
    raw: { bookingId: res.bookingId, review: res },
  };
}

module.exports = { name: 'tripjack', search, price };
