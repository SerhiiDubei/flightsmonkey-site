'use strict';
// Central configuration. Everything comes from .env (see .env.example).
require('dotenv').config();
const path = require('path');

const ROOT = path.join(__dirname, '..');

const cfg = {
  root: ROOT,
  port: Number(process.env.PORT) || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'dev-only-insecure-secret',
  // which flight supplier answers searches: 'amadeus' | 'tripjack' | 'duffel' | 'mock'
  provider: (process.env.FLIGHT_PROVIDER || 'mock').toLowerCase(),
  currency: (process.env.CURRENCY || 'CAD').toUpperCase(),
  maxResults: Number(process.env.MAX_RESULTS) || 250,
  pageSize: 10, // the original front-end JS expects pages of 10 cards
  amadeus: {
    clientId: process.env.AMADEUS_CLIENT_ID || '',
    clientSecret: process.env.AMADEUS_CLIENT_SECRET || '',
    env: (process.env.AMADEUS_ENV || 'test').toLowerCase(), // 'test' | 'production'
    confirmPrice: /^(1|true|yes)$/i.test(process.env.AMADEUS_CONFIRM_PRICE || 'true'),
  },
  duffel: {
    accessToken: process.env.DUFFEL_ACCESS_TOKEN || '',
    // how many cheapest offers to pull; asking for all of them can be thousands / tens of MB
    limit: Number(process.env.DUFFEL_LIMIT) || 100,
  },
  // The consolidator endpoint the client supplied — the one that has to work
  // in production. Credentials ride in the query string by the supplier's
  // design, so they belong in .env and nowhere else.
  wikiproject: {
    endpoint: process.env.WIKIPROJECT_ENDPOINT || 'https://agency.wikiproject.in/',
    userId:   process.env.WIKIPROJECT_USERID   || '',
    password: process.env.WIKIPROJECT_PASSWORD || '',
    metaId:   process.env.WIKIPROJECT_METAID   || '2023',
    website:  process.env.WIKIPROJECT_WEBSITE  || '',
    currency: (process.env.WIKIPROJECT_CURRENCY || 'USD').toUpperCase(),
    // Blank means "no cap"; the endpoint returned 700 offers (1.7 MB) for a
    // single round trip, which is more than any results page needs.
    limit: Number(process.env.WIKIPROJECT_LIMIT) || 0,
    timeoutMs: Number(process.env.WIKIPROJECT_TIMEOUT_MS) || 45000,
  },
  tripjack: {
    apiKey: process.env.TRIPJACK_API_KEY || '',
    baseUrl: (process.env.TRIPJACK_BASE_URL || 'https://apitest.tripjack.com').replace(/\/+$/, ''),
    // TripJack quotes fares in INR; the original site divides by a fixed rate to show CAD.
    fxDivisor: Number(process.env.TRIPJACK_FX_DIVISOR) || 61.43,
  },
  // Every brand-bearing string on the site comes from here. The pages carry
  // {{SITE_NAME}} & co. as placeholders, so renaming the business is a .env edit.
  site: {
    // Defaults are the client's, from the brief: Flights Monkey LLC on the
    // domain they bought, ReservationsFlightsToday.com. Nothing here may
    // fall back to xtremefares.com — that is the reference site this was
    // modelled on and a real company; its name, domain, phone numbers and
    // Brampton address must never ship.
    name: process.env.SITE_NAME || 'Flights Monkey',
    legal: process.env.SITE_LEGAL || 'Flights Monkey LLC',
    domain: process.env.SITE_DOMAIN || 'reservationsflightstoday.com',
    url: process.env.SITE_URL || `https://${process.env.SITE_DOMAIN || 'reservationsflightstoday.com'}`,
    // The client has no numbers yet and will put them in themselves (agreed in
    // the task on 28.09), so the site carries a placeholder that cannot pass
    // for a real line — 1-800-555-0100 could. The Alaska page's own number
    // follows SITE_PHONE unless set, so one real number fixes every page.
    phone: process.env.SITE_PHONE || '+11111111111',
    phoneAlt: process.env.SITE_PHONE_ALT || process.env.SITE_PHONE || '+11111111111',
    // Second and third footer lines. Optional: empty hides the line, rather
    // than printing the main number three times over.
    phone2: process.env.SITE_PHONE_2 || '',
    phone3: process.env.SITE_PHONE_3 || '',
    email: process.env.SITE_EMAIL || `info@${process.env.SITE_DOMAIN || 'reservationsflightstoday.com'}`,
    // From the client via the task, 28.09.
    address: process.env.SITE_ADDRESS || '7900 N Stadium Drive, Houston, TX 77030',
    ein: process.env.SITE_EIN || '99-4660195',
  },
  // optional default origin for the "/city" geo endpoint (IATA code), empty = disabled
  defaultOrigin: (process.env.DEFAULT_ORIGIN || '').toUpperCase(),
  leadsDir: path.join(ROOT, 'data', 'leads'),
  bookingsDir: path.join(ROOT, 'data', 'bookings'),
  pagesDir: path.join(ROOT, 'pages'),
  publicDir: path.join(ROOT, 'public'),
  // Call tracking (ТЗ 23.10.2026). Both optional: empty GA4_ID loads no analytics at all;
  // the call-click events still go to window.dataLayer, so GTM can pick them up later.
  analytics: {
    ga4Id: process.env.GA4_ID || '',
    // Google Ads conversion for a call click, "AW-123456789/AbCdEf" — set with the PPC specialist.
    adsCallConversion: process.env.GOOGLE_ADS_CALL_CONVERSION || '',
  },
};

module.exports = cfg;
