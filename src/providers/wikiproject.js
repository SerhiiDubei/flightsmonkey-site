'use strict';
/**
 * Adapter for the consolidator endpoint the client supplied.
 *
 *   GET https://agency.wikiproject.in/?JType=roundtrip&org=MSP&dest=CLT&...
 *
 * This is the API that actually has to work in production. It is not the
 * public TripJack NDC API (providers/tripjack.js) and it is not Duffel —
 * Duffel was ruled out on cost, and the endpoint below is what the client's
 * supplier handed over, credentials and all.
 *
 * Three things about it are worth knowing before touching this file.
 *
 * 1. Credentials travel in the query string. That is the supplier's design,
 *    not ours. It means the URL must never be logged verbatim: redact() below
 *    exists for that, and every error message goes through it.
 *
 * 2. Failures come back as HTTP 200 with {"message":"..."} instead of a 4xx.
 *    Checking res.ok is therefore not enough — an expired password looks
 *    exactly like a successful request until you read the body.
 *
 * 3. The success payload follows the Amadeus flight-offers shape closely
 *    enough that the normalisation here mirrors providers/amadeus.js. Close,
 *    but not identical: `airline` carries a display name the segment does not
 *    otherwise provide, `aircraft.code` is a marketing name ("Boeing 737")
 *    rather than an IATA equipment code, and terminals come back as "".
 *
 * Verified against the live endpoint on 2026-09-23: 700 offers for a MSP-CLT
 * round trip in 1.8s, cabins Y/S/B/F all returning distinct fares.
 */
const cfg = require('../config');
const data = require('../data');
const { isoDurToMin, round2 } = require('../util');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The supplier's cabin codes. Anything unknown falls back to economy. */
const CABIN_OUT = {
  ECONOMY: 'Y',
  PREMIUM_ECONOMY: 'S',
  BUSINESS: 'B',
  FIRST: 'F',
};

/** 2026-11-20 -> Nov-20-2026, the only date format the endpoint accepts. */
function toApiDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  if (!m) throw new Error(`Bad date "${iso}" — expected YYYY-MM-DD`);
  return `${MONTHS[Number(m[2]) - 1]}-${m[3]}-${m[1]}`;
}

/** Strip the credentials out of a URL before it reaches a log or an error. */
function redact(url) {
  return String(url).replace(/([?&])(password|userid)=[^&]*/gi, '$1$2=***');
}

function buildUrl(q) {
  const c = cfg.wikiproject;
  if (!c.userId || !c.password) {
    throw new Error('WIKIPROJECT_USERID / WIKIPROJECT_PASSWORD are not set (see .env.example)');
  }

  const url = new URL(c.endpoint);
  const p = url.searchParams;
  p.set('JType', q.tripType === 'oneway' ? 'oneway' : 'roundtrip');
  p.set('org', String(q.origin || '').toUpperCase());
  p.set('dest', String(q.destination || '').toUpperCase());
  p.set('depDt', toApiDate(q.departDate));
  if (q.tripType !== 'oneway') p.set('retDt', toApiDate(q.returnDate));
  p.set('adt', String(q.adults ?? 1));
  p.set('chd', String(q.children ?? 0));
  p.set('inf', String(q.infants ?? 0));
  p.set('ct', CABIN_OUT[q.cabin] || CABIN_OUT.ECONOMY);
  p.set('userid', c.userId);
  p.set('password', c.password);
  p.set('metaId', c.metaId);
  p.set('website', c.website);
  p.set('limit', c.limit ? String(c.limit) : '');
  p.set('airlines', q.airline || '');
  p.set('currency', q.currency || c.currency);
  return url;
}

async function call(q) {
  const url = buildUrl(q);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), cfg.wikiproject.timeoutMs);

  let res;
  try {
    res = await fetch(url, { signal: ac.signal, headers: { Accept: 'application/json' } });
  } catch (err) {
    // An abort surfaces as a generic AbortError; say what actually happened.
    if (err.name === 'AbortError') {
      throw new Error(`Flight API timed out after ${cfg.wikiproject.timeoutMs}ms — ${redact(url)}`);
    }
    throw new Error(`Flight API unreachable: ${err.message} — ${redact(url)}`);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Flight API returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }

  // The important one: errors arrive as 200 + {message}. Treat the presence of
  // `message` without `data` as the failure it is, whatever the status said.
  if (json && json.message && !json.data) {
    throw new Error(`Flight API refused the request: ${json.message}`);
  }
  if (!res.ok) {
    throw new Error(`Flight API ${res.status}: ${text.slice(0, 200)}`);
  }
  return json;
}

/** Supplier payload -> the provider-agnostic offer model in providers/index.js. */
function normalize(json, q) {
  const offers = Array.isArray(json && json.data) ? json.data : [];

  return offers.map((o, idx) => {
    const cur = (o.price && o.price.currency) || q.currency || cfg.wikiproject.currency;

    const itineraries = (o.itineraries || []).map((it) => {
      const segments = (it.segments || []).map((s) => {
        const carrier = s.carrierCode || '';
        const fare = ((o.travelerPricings || [])[0] || {}).fareDetailsBySegment || [];
        const seg = fare[0] || {};
        return {
          carrier,
          // The endpoint supplies a display name; fall back to our own table
          // so an unknown carrier still renders as something readable.
          carrierName: s.airline || data.airlineName(carrier, carrier),
          operatingCarrier: (s.operating && s.operating.carrierCode) || carrier,
          flightNumber: String(s.number || ''),
          // Marketing name, not an IATA equipment code — shown as-is.
          aircraft: (s.aircraft && s.aircraft.code) || '',
          from: { code: (s.departure && s.departure.iataCode) || '', terminal: (s.departure && s.departure.terminal) || '' },
          to:   { code: (s.arrival   && s.arrival.iataCode)   || '', terminal: (s.arrival   && s.arrival.terminal)   || '' },
          departAt: (s.departure && s.departure.at) || '',
          arriveAt: (s.arrival   && s.arrival.at)   || '',
          duration: isoDurToMin(s.duration),
          cabin: seg.cabin || q.cabin || 'ECONOMY',
          bookingClass: seg.class || o.classofService || '',
          bags: String(((seg.includedCheckedBags || {}).quantity) ?? ''),
        };
      });

      return {
        duration: isoDurToMin(it.duration) || segments.reduce((a, s) => a + s.duration, 0),
        // numberOfStops is per segment; the itinerary's stop count is the
        // number of plane changes, i.e. one less than the segment count.
        stops: Math.max(0, segments.length - 1)
             + segments.reduce((a, s) => a + (Number(s.numberOfStops) || 0), 0),
        segments,
      };
    });

    // grandTotal covers every passenger in the request, so the per-traveller
    // figures have to come from travelerPricings rather than a division.
    const tp = o.travelerPricings || [];
    const byType = (t) => {
      const hit = tp.find((x) => x.travelerType === t);
      if (!hit || !hit.price) return 0;
      return round2(Number(hit.price.base || 0) + Number(hit.price.fees || 0));
    };

    const total = round2(Number((o.price && o.price.grandTotal) || 0));
    const base  = round2(Number((o.price && o.price.base) || 0));
    const fees  = round2(Number((o.price && o.price.fees) || 0));

    return {
      id: o.id || `wp-${idx}`,
      provider: 'wikiproject',
      currency: cur,
      price: {
        total,
        base,
        taxes: fees || round2(total - base),
        perAdult:  byType('ADULT'),
        perChild:  byType('CHILD'),
        perInfant: byType('HELD_INFANT') || byType('INFANT'),
      },
      seats: Number(o.numberOfBookableSeats) || 0,
      validatingAirline: (o.validatingAirlineCodes || [])[0] || '',
      itineraries,
      raw: o,
    };
  });
}

async function search(q) {
  const json = await call(q);
  const offers = normalize(json, q);

  // Non-stop is a post-filter: the endpoint has no parameter for it, and
  // asking for `type: pureNonStop` is not something it accepts on input.
  const filtered = q.nonStop
    ? offers.filter((o) => o.itineraries.every((it) => it.stops === 0))
    : offers;

  const sorted = filtered.sort((a, b) => a.price.total - b.price.total);

  // The `limit` query parameter is accepted and then ignored — verified on
  // 2026-09-23, where limit=10, limit=60 and no limit all returned the same
  // 700 offers. So the cap has to be applied here, after sorting, which at
  // least means the offers we keep are the cheapest rather than an arbitrary
  // slice of the supplier's ordering.
  const cap = cfg.wikiproject.limit;
  return cap > 0 ? sorted.slice(0, cap) : sorted;
}

/**
 * There is no price-confirmation endpoint, so the fare shown at search time is
 * the fare carried through to booking. Re-running the search would only return
 * the same quote from the supplier's cache (ResponseTTL is ~2s) without
 * revalidating anything, so this returns the offer's own figures rather than
 * pretending a second call means confirmation.
 */
async function price(offer) {
  return {
    total: offer.price.total,
    base: offer.price.base,
    currency: offer.currency,
    raw: { confirmed: false, reason: 'supplier exposes no pricing endpoint' },
  };
}

/**
 * No addressable offer endpoint either: ids encode the route and timings
 * ("MSP-202611150610-AA-0-CLT-..."), they are not tokens the supplier will
 * look up. Re-run the search and match, so a booking page opened in a second
 * tab still finds its offer.
 */
async function fetchOffer(id, q) {
  if (!q) return null;
  const offers = await search(q);
  return offers.find((o) => o.id === id) || null;
}

module.exports = { name: 'wikiproject', search, price, fetchOffer, _redact: redact, _toApiDate: toApiDate };
