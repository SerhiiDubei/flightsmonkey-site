'use strict';
// Static reference data: airports (OurAirports), airlines (OpenFlights) and metro city codes.
// Used by the autocomplete endpoints (/flightname, /preferairline) and by the renderer to turn
// IATA codes into airport / city / airline names.
const { titleCase } = require('./util');

// Static relative requires (not path.join) so bundlers and Vercel's dependency tracer can see
// these files and include them in the deployed function.
const airports = require('../data/airports.json');
const airlines = require('../data/airlines.json');
const metro = require('../data/metro.json');

const byCode = new Map(airports.map((a) => [a.code, a]));
const airlineByCode = new Map(airlines.map((a) => [a.code, a]));

function airport(code) {
  code = String(code || '').toUpperCase();
  const a = byCode.get(code);
  if (a) return a;
  const members = metro[code];
  if (members) {
    const first = byCode.get(members[0]);
    return {
      code, cityCode: code,
      name: (first ? first.city : code) + ' All Airports',
      city: first ? first.city : code,
      country: first ? first.country : '', cc: first ? first.cc : '',
    };
  }
  return { code, cityCode: code, name: code, city: code, country: '', cc: '' };
}

/**
 * Resolve an airline code to a display name.
 * The curated list is preferred because some suppliers send ALL-CAPS names, but OpenFlights
 * carries a few junk rows whose "name" is just the code again (ZZ -> "Zz", N1 -> "N1"). In that
 * case the supplier's own name wins, which is how "ZZ" correctly reads as "Duffel Airways".
 */
function airlineName(code, fallback) {
  const c = String(code || '').toUpperCase();
  const local = airlineByCode.get(c);
  const localUsable = local && local.name.toUpperCase() !== c && local.name.trim().length > 2;
  if (localUsable) return local.name;
  const supplied = fallback ? String(fallback).trim() : '';
  if (!supplied) return local ? local.name : c;
  // GDS feeds often shout ("AMERICAN AIRLINES"); leave properly cased names alone
  return supplied === supplied.toUpperCase() && /[A-Z]{2,}\s/.test(supplied) ? titleCase(supplied) : supplied;
}

function logo(code) {
  return `/assets/images/uploads/airlines/${String(code || '').toUpperCase()}.png`;
}

// Same JSON shape as the original /flightname endpoint:
//   record  -> city level "All Airports" entries
//   record2 -> individual airports
function searchAirports(q, limit = 12) {
  q = String(q || '').trim().toLowerCase();
  if (q.length < 2) return { record: [], record2: [] };
  // score: exact IATA code > city starts with > airport name starts with > contains; big airports first
  const scored = [];
  for (const a of airports) {
    const code = a.code.toLowerCase(), city = a.city.toLowerCase(), name = a.name.toLowerCase();
    let s = 0;
    if (code === q) s = 50;
    else if (city.startsWith(q)) s = 40;
    else if (name.startsWith(q)) s = 30;
    else if (city.includes(q) || name.includes(q)) s = 20;
    else if (a.country.toLowerCase().startsWith(q)) s = 10;
    if (s) scored.push([s + a.rank, a]);
  }
  scored.sort((x, y) => y[0] - x[0]);
  const list = scored.slice(0, limit).map((x) => x[1]);
  const rec = (a) => ({
    name: a.name, code: a.code, cityname: a.city, countryname: a.country.toUpperCase(),
    countrycode: a.cc, cityCode: a.cityCode, score: null,
  });
  const record = [];
  const top = list[0];
  if (top && metro[top.cityCode] && metro[top.cityCode].length > 1) {
    record.push({
      name: `${top.city} All Airports`, code: top.cityCode, cityname: top.city,
      countryname: top.country.toUpperCase(), countrycode: top.cc, cityCode: top.cityCode, score: null,
    });
  }
  return { record, record2: list.map(rec) };
}

function searchAirlines(q, limit = 15) {
  q = String(q || '').trim().toLowerCase();
  if (!q) return [];
  return airlines
    .filter((a) => a.name.toLowerCase().includes(q) || a.code.toLowerCase() === q)
    .slice(0, limit);
}

// "New York, UNITED STATES" — the label format the original search form stores in from_air/dest_air
function label(code) {
  const a = airport(code);
  return a.country ? `${a.city}, ${a.country.toUpperCase()}` : a.city;
}

module.exports = { airport, airlineName, logo, searchAirports, searchAirlines, label, metro };
