'use strict';
// Deterministic fake supplier: lets you run the whole UI (search, filters, sorting, booking)
// without any API credentials. Results depend only on the query, so reloads are stable.
const data = require('../data');
const { round2, pad2 } = require('../util');

const AIRLINES = ['AA', 'DL', 'UA', 'AC', 'WS', 'BA', 'LH', 'AF', 'KL', 'B6', 'AS', 'PD'];
const HUBS = ['ORD', 'DFW', 'ATL', 'DEN', 'YUL', 'PHX', 'CLT', 'IAH', 'EWR', 'YYC'];
const AIRCRAFT = ['Boeing 737-800', 'Airbus A321', 'Boeing 787-9', 'Airbus A320neo', 'Embraer 175'];

function rng(seed) {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function at(date, minutes) {
  const d = Math.floor(minutes / 1440);
  const [y, m, day] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day + d, 0, 0));
  const mm = ((minutes % 1440) + 1440) % 1440;
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}T${pad2(Math.floor(mm / 60))}:${pad2(mm % 60)}:00`;
}

function leg(rand, from, to, date, carrier, stops, cabin) {
  const route = stops ? [from, HUBS[Math.floor(rand() * HUBS.length)], to] : [from, to];
  const segments = [];
  let t = 300 + Math.floor(rand() * 16) * 60 + Math.floor(rand() * 4) * 15; // 05:00 .. 21:45
  for (let i = 0; i < route.length - 1; i++) {
    const dur = 90 + Math.floor(rand() * 300);
    segments.push({
      carrier, carrierName: data.airlineName(carrier), operatingCarrier: carrier,
      flightNumber: String(100 + Math.floor(rand() * 4800)),
      aircraft: AIRCRAFT[Math.floor(rand() * AIRCRAFT.length)],
      from: { code: route[i], terminal: String(1 + Math.floor(rand() * 4)) },
      to: { code: route[i + 1], terminal: String(1 + Math.floor(rand() * 4)) },
      departAt: at(date, t), arriveAt: at(date, t + dur), duration: dur,
      cabin, bookingClass: 'VXYZ'[Math.floor(rand() * 4)], bags: stops ? '1' : String(Math.floor(rand() * 2)),
    });
    t += dur + 60 + Math.floor(rand() * 150); // layover
  }
  const first = segments[0], last = segments[segments.length - 1];
  const [fy, fm, fd] = first.departAt.slice(0, 10).split('-').map(Number);
  const [ly, lm, ld] = last.arriveAt.slice(0, 10).split('-').map(Number);
  const dayDiff = Math.round((Date.UTC(ly, lm - 1, ld) - Date.UTC(fy, fm - 1, fd)) / 86400000);
  const toMin = (s) => { const [h, m] = s.slice(11, 16).split(':').map(Number); return h * 60 + m; };
  return { duration: dayDiff * 1440 + toMin(last.arriveAt) - toMin(first.departAt), stops: segments.length - 1, segments };
}

async function search(q) {
  const rand = rng(JSON.stringify([q.origin, q.destination, q.departDate, q.returnDate, q.tripType, q.cabin]));
  const n = 42;
  const offers = [];
  for (let i = 0; i < n; i++) {
    const carrier = q.airline || AIRLINES[Math.floor(rand() * AIRLINES.length)];
    const stops = q.nonStop ? 0 : (rand() < 0.45 ? 0 : 1);
    const itineraries = [leg(rand, q.origin, q.destination, q.departDate, carrier, stops, q.cabin)];
    if (q.tripType === 'round') itineraries.push(leg(rand, q.destination, q.origin, q.returnDate, carrier, rand() < 0.5 ? 0 : 1, q.cabin));
    const cabinMul = { ECONOMY: 1, PREMIUM_ECONOMY: 1.8, BUSINESS: 3.2, FIRST: 5 }[q.cabin] || 1;
    const perAdult = round2((220 + rand() * 900) * cabinMul * (q.tripType === 'round' ? 1.7 : 1));
    const perChild = round2(perAdult * 0.75), perInfant = round2(perAdult * 0.1);
    const total = round2(perAdult * q.adults + perChild * q.children + perInfant * q.infants);
    offers.push({
      id: `mock:${i}`, provider: 'mock', currency: q.currency,
      price: { total, base: round2(total * 0.78), taxes: round2(total * 0.22), perAdult, perChild, perInfant },
      seats: 1 + Math.floor(rand() * 9),
      validatingAirline: carrier, itineraries, raw: { mock: true },
    });
  }
  return offers.sort((a, b) => a.price.total - b.price.total);
}

async function price(offer) {
  return { total: offer.price.total, base: offer.price.base, currency: offer.currency, raw: { mock: true } };
}

module.exports = { name: 'mock', search, price };
