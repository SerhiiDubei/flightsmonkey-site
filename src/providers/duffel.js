'use strict';
// Duffel adapter (https://duffel.com/docs) — self-serve flight content, NDC + GDS.
//
// Two-step search on purpose:
//   1. POST /air/offer_requests?return_offers=false   -> offer_request id
//   2. GET  /air/offers?offer_request_id=..&sort=total_amount&limit=N
// Asking for offers inline (return_offers=true) returns EVERY offer: a 2-passenger return
// LHR-JFK came back as 1326 offers / 18 MB, which blows the serverless response budget.
// The paginated form returns the cheapest N already sorted (50 offers ≈ 770 KB).
//
// Pricing confirmation: Duffel offers expire (expires_at, ~30 min), so the booking page
// re-fetches the offer to show a fare that is still valid.
const cfg = require('../config');
const data = require('../data');
const { isoDurToMin, round2, toMinutes } = require('../util');

const BASE = 'https://api.duffel.com';
const VERSION = 'v2';

function headers() {
  if (!cfg.duffel.accessToken) {
    throw new Error('DUFFEL_ACCESS_TOKEN is not set (see .env.example)');
  }
  return {
    Authorization: `Bearer ${cfg.duffel.accessToken}`,
    'Duffel-Version': VERSION,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

async function call(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) { /* not json */ }
  if (!res.ok) {
    const msg = json && Array.isArray(json.errors)
      ? json.errors.map((e) => `${e.code || ''}: ${e.message || e.title || ''}`).join('; ')
      : text.slice(0, 400);
    throw new Error(`Duffel ${method} ${path} -> ${res.status} ${msg}`);
  }
  return json;
}

const CABIN = {
  ECONOMY: 'economy', PREMIUM_ECONOMY: 'premium_economy', BUSINESS: 'business', FIRST: 'first',
};

function passengerList(q) {
  const list = [];
  for (let i = 0; i < q.adults; i++) list.push({ type: 'adult' });
  for (let i = 0; i < q.children; i++) list.push({ type: 'child' });
  for (let i = 0; i < q.infants; i++) list.push({ type: 'infant_without_seat' });
  return list;
}

/** @param {import('./index').SearchQuery} q */
async function search(q) {
  const slices = [{ origin: q.origin, destination: q.destination, departure_date: q.departDate }];
  if (q.tripType === 'round' && q.returnDate) {
    slices.push({ origin: q.destination, destination: q.origin, departure_date: q.returnDate });
  }
  const body = {
    data: {
      slices,
      passengers: passengerList(q),
      cabin_class: CABIN[q.cabin] || 'economy',
      ...(q.nonStop ? { max_connections: 0 } : {}),
    },
  };
  const req = await call('/air/offer_requests?return_offers=false', { method: 'POST', body });
  const requestId = req.data.id;
  const limit = Math.min(Number(cfg.duffel.limit) || 100, 200);
  const res = await call(`/air/offers?offer_request_id=${encodeURIComponent(requestId)}&sort=total_amount&limit=${limit}`);
  let offers = (res.data || []).map((o, i) => normalize(o, q, i)).filter(Boolean);
  // Duffel has no "only these airlines" search filter, so a preferred airline is applied here.
  if (q.airline) offers = offers.filter((o) => o.validatingAirline === q.airline);
  return offers;
}

function bags(segPax) {
  const list = (segPax && segPax.baggages) || [];
  const checked = list.find((b) => b.type === 'checked');
  return checked ? String(checked.quantity) : '0';
}

function normalize(o, q, idx) {
  const paxCount = Math.max(1, q.adults + q.children + q.infants);
  const total = round2(o.total_amount);
  const base = round2(o.base_amount);

  const itineraries = (o.slices || []).map((slice) => {
    const segments = (slice.segments || []).map((s) => {
      const mk = s.marketing_carrier || {};
      const segPax = (s.passengers || [])[0] || {};
      return {
        carrier: mk.iata_code || '',
        carrierName: data.airlineName(mk.iata_code, mk.name),
        operatingCarrier: (s.operating_carrier || {}).iata_code || mk.iata_code || '',
        flightNumber: s.marketing_carrier_flight_number || '',
        aircraft: (s.aircraft && s.aircraft.name) || '',
        from: { code: (s.origin || {}).iata_code || '', terminal: s.origin_terminal || '' },
        to: { code: (s.destination || {}).iata_code || '', terminal: s.destination_terminal || '' },
        departAt: s.departing_at,
        arriveAt: s.arriving_at,
        duration: isoDurToMin(s.duration)
          || Math.max(0, toMinutes(s.arriving_at) - toMinutes(s.departing_at)),
        cabin: (segPax.cabin_class || q.cabin).toUpperCase(),
        bookingClass: segPax.fare_basis_code || '',
        bags: bags(segPax),
      };
    });
    return {
      duration: isoDurToMin(slice.duration) || segments.reduce((a, s) => a + s.duration, 0),
      stops: Math.max(0, segments.length - 1),
      segments,
    };
  });

  if (!itineraries.length || !itineraries[0].segments.length) return null;

  // Duffel prices an offer as a whole and does not break the total down per passenger type,
  // so the per-passenger figures shown in the fare table are an even split of the total.
  const perHead = round2(total / paxCount);

  return {
    id: `duffel:${o.id}`,
    provider: 'duffel',
    currency: o.total_currency || cfg.currency,
    price: {
      total,
      base,
      taxes: round2(o.tax_amount || total - base),
      perAdult: perHead,
      perChild: q.children ? perHead : 0,
      perInfant: q.infants ? perHead : 0,
    },
    seats: 0, // Duffel does not expose remaining seat counts on an offer
    validatingAirline: (o.owner || {}).iata_code || itineraries[0].segments[0].carrier,
    itineraries,
    raw: { offerId: o.id, expiresAt: o.expires_at },
  };
}

/**
 * Fetch ONE offer by id and normalize it.
 * Essential on serverless: Duffel mints fresh offer ids for every offer_request, so an instance
 * that did not run the original search cannot find the chosen offer by re-searching. Duffel keeps
 * an offer retrievable until it expires (~30 min), which is exactly the booking window.
 */
async function fetchOffer(id, q) {
  const offerId = String(id || '').replace(/^duffel:/, '');
  if (!offerId) return null;
  const res = await call(`/air/offers/${encodeURIComponent(offerId)}?return_available_services=false`);
  return res && res.data ? normalize(res.data, q) : null;
}

/** Re-fetch the offer so the booking page shows a fare that has not expired. */
async function price(offer) {
  const id = offer.raw && offer.raw.offerId;
  if (!id) return null;
  const res = await call(`/air/offers/${encodeURIComponent(id)}?return_available_services=false`);
  const o = res.data;
  return {
    total: round2(o.total_amount),
    base: round2(o.base_amount),
    currency: o.total_currency,
    raw: { offerId: o.id, expiresAt: o.expires_at },
  };
}

module.exports = { name: 'duffel', search, price, fetchOffer };
