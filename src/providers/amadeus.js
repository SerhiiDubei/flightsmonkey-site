'use strict';
// Amadeus Self-Service API adapter (https://developers.amadeus.com)
//   - OAuth2 client-credentials token (cached until it expires)
//   - Flight Offers Search  GET  /v2/shopping/flight-offers
//   - Flight Offers Price   POST /v1/shopping/flight-offers/pricing   (re-confirms a fare before booking)
//   - Airport & City Search GET  /v1/reference-data/locations         (optional autocomplete fallback)
// Everything is normalized into the provider-agnostic offer model described in providers/index.js.
const cfg = require('../config');
const data = require('../data');
const { isoDurToMin, toMinutes, round2 } = require('../util');

const HOSTS = { test: 'https://test.api.amadeus.com', production: 'https://api.amadeus.com' };
let tokenCache = { value: null, expiresAt: 0 };

const host = () => HOSTS[cfg.amadeus.env] || HOSTS.test;

async function getToken() {
  if (tokenCache.value && Date.now() < tokenCache.expiresAt - 30000) return tokenCache.value;
  if (!cfg.amadeus.clientId || !cfg.amadeus.clientSecret) {
    throw new Error('AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET are not set (see .env.example)');
  }
  const res = await fetch(host() + '/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: cfg.amadeus.clientId,
      client_secret: cfg.amadeus.clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status} ${await res.text()}`);
  const j = await res.json();
  tokenCache = { value: j.access_token, expiresAt: Date.now() + (Number(j.expires_in) || 1799) * 1000 };
  return tokenCache.value;
}

async function call(path, { method = 'GET', query, body } = {}) {
  const token = await getToken();
  const url = new URL(host() + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/vnd.amadeus+json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) { /* not json */ }
  if (!res.ok) {
    const msg = json && Array.isArray(json.errors)
      ? json.errors.map((e) => `${e.code || ''} ${e.title || ''}: ${e.detail || ''}`).join('; ')
      : text.slice(0, 500);
    throw new Error(`Amadeus ${method} ${path} -> ${res.status} ${msg}`);
  }
  return json;
}

/** @param {import('./index').SearchQuery} q */
async function search(q) {
  const query = {
    originLocationCode: q.origin,
    destinationLocationCode: q.destination,
    departureDate: q.departDate,
    returnDate: q.tripType === 'round' ? q.returnDate : undefined,
    adults: q.adults,
    children: q.children || undefined,
    infants: q.infants || undefined,
    travelClass: q.cabin,
    nonStop: q.nonStop ? 'true' : undefined,
    currencyCode: q.currency,
    max: cfg.maxResults,
    includedAirlineCodes: q.airline || undefined,
  };
  const res = await call('/v2/shopping/flight-offers', { query });
  return normalize(res, q);
}

function normalize(res, q) {
  const dict = res.dictionaries || {};
  const carriers = dict.carriers || {};
  const aircraftDict = dict.aircraft || {};
  return (res.data || []).map((o, idx) => {
    const perType = {};
    const bagsBySeg = {};
    const cabinBySeg = {};
    for (const tp of o.travelerPricings || []) {
      if (!(tp.travelerType in perType)) perType[tp.travelerType] = round2((tp.price || {}).total);
      for (const fd of tp.fareDetailsBySegment || []) {
        if (fd.segmentId in bagsBySeg) continue;
        const b = fd.includedCheckedBags || {};
        bagsBySeg[fd.segmentId] = b.quantity != null ? String(b.quantity)
          : (b.weight ? `${b.weight} ${b.weightUnit || 'KG'}` : '0');
        cabinBySeg[fd.segmentId] = { cabin: fd.cabin || q.cabin, cls: fd.class || '' };
      }
    }
    const itineraries = (o.itineraries || []).map((it) => {
      const segments = (it.segments || []).map((s) => ({
        carrier: s.carrierCode,
        carrierName: data.airlineName(s.carrierCode, carriers[s.carrierCode]),
        operatingCarrier: (s.operating || {}).carrierCode || s.carrierCode,
        flightNumber: s.number || '',
        aircraft: aircraftDict[(s.aircraft || {}).code] || (s.aircraft || {}).code || '',
        from: { code: s.departure.iataCode, terminal: s.departure.terminal || '' },
        to: { code: s.arrival.iataCode, terminal: s.arrival.terminal || '' },
        departAt: s.departure.at,
        arriveAt: s.arrival.at,
        duration: isoDurToMin(s.duration) || Math.max(0, toMinutes(s.arrival.at) - toMinutes(s.departure.at)),
        cabin: (cabinBySeg[s.id] || {}).cabin || q.cabin,
        bookingClass: (cabinBySeg[s.id] || {}).cls || '',
        bags: bagsBySeg[s.id] != null ? bagsBySeg[s.id] : '0',
      }));
      return {
        duration: isoDurToMin(it.duration) || segments.reduce((a, s) => a + s.duration, 0),
        stops: Math.max(0, segments.length - 1),
        segments,
      };
    });
    const total = round2(o.price.grandTotal || o.price.total);
    const base = round2(o.price.base);
    return {
      id: `amadeus:${idx}`,
      provider: 'amadeus',
      currency: o.price.currency || q.currency,
      price: {
        total, base, taxes: round2(total - base),
        perAdult: perType.ADULT || round2(total / Math.max(1, q.adults)),
        perChild: perType.CHILD || 0,
        perInfant: perType.HELD_INFANT || perType.SEATED_INFANT || 0,
      },
      seats: Number(o.numberOfBookableSeats) || 0,
      validatingAirline: (o.validatingAirlineCodes || [])[0] || itineraries[0].segments[0].carrier,
      itineraries,
      raw: o, // needed verbatim by Flight Offers Price / Flight Create Orders
    };
  });
}

/** Re-price one offer right before booking (Amadeus recommends it: fares change quickly). */
async function price(offer) {
  const res = await call('/v1/shopping/flight-offers/pricing', {
    method: 'POST',
    body: { data: { type: 'flight-offers-pricing', flightOffers: [offer.raw] } },
  });
  const fo = res && res.data && res.data.flightOffers && res.data.flightOffers[0];
  if (!fo) return null;
  return {
    total: round2(fo.price.grandTotal || fo.price.total),
    base: round2(fo.price.base),
    currency: fo.price.currency,
    raw: fo,
  };
}

async function locations(keyword) {
  return call('/v1/reference-data/locations', { query: { subType: 'AIRPORT,CITY', keyword, 'page[limit]': 10 } });
}

module.exports = { name: 'amadeus', search, price, locations };
