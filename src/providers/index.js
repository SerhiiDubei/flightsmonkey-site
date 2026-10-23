'use strict';
// Provider registry. Every adapter exposes the same two calls and returns the same offer model:
//
// SearchQuery  { tripType:'round'|'oneway', origin, destination, departDate:'YYYY-MM-DD',
//                returnDate, adults, children, infants, cabin:'ECONOMY'|'PREMIUM_ECONOMY'|'BUSINESS'|'FIRST',
//                nonStop:boolean, airline:'AA'|'', currency:'CAD' }
//
// Offer        { id, provider, currency,
//                price:{ total, base, taxes, perAdult, perChild, perInfant },
//                seats, validatingAirline,
//                itineraries:[ { duration(min), stops, segments:[ { carrier, carrierName, operatingCarrier,
//                    flightNumber, aircraft, from:{code,terminal}, to:{code,terminal}, departAt, arriveAt,
//                    duration(min), cabin, bookingClass, bags } ] } ],
//                raw }   // whatever the supplier needs back for pricing / booking
const cfg = require('../config');

const registry = {
  wikiproject: require('./wikiproject'),
  amadeus: require('./amadeus'),
  tripjack: require('./tripjack'),
  duffel: require('./duffel'),
  mock: require('./mock'),
};

function current() {
  const p = registry[cfg.provider];
  if (!p) throw new Error(`Unknown FLIGHT_PROVIDER "${cfg.provider}" `
    + `(use wikiproject | tripjack | duffel | amadeus | mock)`);
  return p;
}

/**
 * Retrieve a single offer by id, for instances that did not run the original search.
 * Optional per provider: returns null when the supplier cannot address an offer directly,
 * in which case the caller falls back to re-running the search.
 */
async function fetchOffer(id, q) {
  const p = current();
  if (typeof p.fetchOffer !== 'function') return null;
  try {
    return await p.fetchOffer(id, q);
  } catch (err) {
    console.error(`[${p.name}] fetchOffer(${id}) failed:`, err.message);
    return null;
  }
}

module.exports = {
  get name() { return current().name; },
  search: (q) => current().search(q),
  price: (offer) => current().price(offer),
  fetchOffer,
  registry,
};
