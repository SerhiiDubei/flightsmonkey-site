'use strict';
// Flight booking site — Express server
//   static mirror  : /pages/*.html (served by slug) + /public (assets, mirrored JS/CSS)
//   flight search  : the same URLs the original front-end JS calls, backed by src/providers/*
const express = require('express');

const cfg = require('./src/config');
const data = require('./src/data');
const providers = require('./src/providers');
const offersLib = require('./src/offers');
const render = require('./src/render');
const tpl = require('./src/templates');
const pricing = require('./src/pricing');
const session = require('./src/session');
const store = require('./src/store');
const { usToIso, isoToUs, esc, money, fmtDur } = require('./src/util');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(session.middleware(cfg.sessionSecret));
// Locally Express serves the mirrored assets; on Vercel the CDN serves /public before the
// function is reached, so this middleware simply never sees those requests there.
// Cache policy: a request that carries ?v= is content-versioned, so it can be
// cached hard. Anything else gets an hour, because a 7-day blanket meant a
// returning visitor kept an old image for a week after we replaced the file —
// their cached HTML asked for the unversioned URL and the browser answered
// from disk without ever contacting us.
// A ?v= query means the URL changes whenever the file does, so the response
// can be cached for a year. That is right in production and actively harmful
// in development: `immutable` tells the browser never to revalidate, so an
// edited stylesheet keeps rendering from cache and every fix looks like it
// did nothing. Outside production the file is therefore always revalidated.
const IMMUTABLE = process.env.NODE_ENV === 'production';

app.use(express.static(cfg.publicDir, {
  index: false,
  setHeaders(res, _path, _stat) {
    const versioned = typeof res.req.query.v === 'string' && res.req.query.v !== '';
    if (!IMMUTABLE) {
      res.setHeader('Cache-Control', 'no-cache');
      return;
    }
    res.setHeader('Cache-Control', versioned
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=3600, must-revalidate');
  },
}));

/* ----------------------------------------------------------------- helpers */

const CABINS = { Economy: 'ECONOMY', 'Premium Economy': 'PREMIUM_ECONOMY', Business: 'BUSINESS', First: 'FIRST' };
const code3 = (s) => (String(s || '').toUpperCase().match(/[A-Z]{3}/) || [''])[0];
const validIso = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(String(s || '').trim()) ? String(s).trim() : '');
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const today = () => new Date().toISOString().slice(0, 10);

function parseSearchForm(b) {
  const tripType = String(b.triptype || b.title13 || 'round') === 'oneway' ? 'oneway' : 'round';
  let departDate = validIso(b.dp_date) || usToIso(b.depart_date) || validIso(b.depart_date);
  let returnDate = tripType === 'round' ? (validIso(b.ar_date) || usToIso(b.return_date) || validIso(b.return_date)) : '';
  if (departDate && departDate < today()) departDate = today();
  if (returnDate && returnDate < departDate) returnDate = departDate;
  const cabinLabel = CABINS[b.class_type] ? b.class_type : (CABINS[b.type] ? b.type : (CABINS[b.class_air] ? b.class_air : 'Economy'));
  const adults = clamp(parseInt(b.adult, 10) || 1, 1, 9);
  const children = clamp(parseInt(b.child, 10) || 0, 0, 8);
  const infants = clamp(parseInt(b.infant, 10) || 0, 0, adults);
  const airline = (String(b.prefferedairline || '').match(/\[([A-Z0-9]{2})\]/) || [])[1] || '';
  return {
    tripType, origin: code3(b.origin), destination: code3(b.destination), departDate, returnDate,
    adults, children, infants, cabinLabel, cabin: CABINS[cabinLabel],
    nonStop: b.nonstop === 'true' || b.nonstop === 'on' || b.nonstop === '1',
    airline, currency: cfg.currency,
  };
}

function paxLabel(q) {
  const parts = [`${q.adults} ADULT`];
  if (q.children) parts.push(`${q.children} CHILD`);
  if (q.infants) parts.push(`${q.infants} INFANT`);
  return parts.join(', ');
}

function ctxFor(q) {
  return {
    tripType: q.tripType, origin: q.origin, destination: q.destination,
    adults: q.adults, children: q.children, infants: q.infants, departDate: q.departDate,
    pricing: (offer) => pricing.applyPricing(offer.price, q),
  };
}

// Results are cached by query (see src/store.js), so the three AJAX calls the results page
// fires in parallel collapse into a single supplier search on any instance.
const ensureOffers = (req) => (req.session.search ? store.getOffers(req.session.search) : null);

/**
 * Locate the offer the customer clicked.
 * On serverless the booking POST may land on an instance that never ran the search, and suppliers
 * such as Duffel mint new offer ids per search, so re-searching would not contain the old id.
 * Order: this instance's cache -> ask the supplier for that exact offer -> give up.
 */
async function findOffer(req, offerId, q) {
  if (!offerId) return null;
  try {
    const entry = await ensureOffers(req);
    const hit = entry && entry.offers.find((o) => o.id === offerId);
    if (hit) return hit;
  } catch (err) {
    console.error('[booking] search lookup failed:', err.message);
  }
  return providers.fetchOffer(offerId, q);
}

const pageOf = (list, offset) => list.slice(offset, offset + cfg.pageSize);
const offsetOf = (v) => Math.max(0, parseInt(v, 10) || 0);

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const withPrefixes = (p) => [p, '/airline' + p, '/tour' + p];

/* ----------------------------------------------------------------- static pages */

function sendPage(res, rel, status = 200) {
  // render(), not load(): the mirrored pages carry {{SITE_NAME}} and friends now.
  res.status(status).type('html').send(tpl.render(rel, {}));
}

app.get('/', (req, res) => sendPage(res, 'index.html'));

app.get('/robots.txt', (req, res) => res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /airline/\nSitemap: /sitemap.xml\n'));
app.get('/sitemap.xml', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  const urls = tpl.staticPages().map((p) => `  <url><loc>${esc(base + p)}</loc></url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

/* ----------------------------------------------------------------- search */

app.post('/airline/searchflight', (req, res) => {
  const q = parseSearchForm(req.body);
  if (!q.origin || !q.destination || !q.departDate || (q.tripType === 'round' && !q.returnDate)) {
    // Log the raw fields: a silent bounce to the home page is indistinguishable from
    // "search is broken", and the date format from the mirrored calendar is easy to get wrong.
    console.warn('[search] rejected incomplete form:', JSON.stringify({
      origin: req.body.origin, destination: req.body.destination,
      depart_date: req.body.depart_date, return_date: req.body.return_date,
      dp_date: req.body.dp_date, ar_date: req.body.ar_date, triptype: req.body.triptype,
    }));
    return res.redirect('/');
  }
  req.session.search = q;
  res.redirect(303, '/airline/searchflight'); // PRG: a refresh must not re-post the form
});

app.get(['/airline/searchflight', '/airline/search'], (req, res) => {
  const q = req.session.search;
  if (!q) return res.redirect('/');
  const round = q.tripType === 'round';
  res.type('html').send(tpl.render('airline/searchflight.html', {
    ORIGIN: q.origin, DEST: q.destination,
    ORIGIN_LABEL: data.label(q.origin), DEST_LABEL: data.label(q.destination),
    DEP_ISO: q.departDate, RET_ISO: q.returnDate, DEP_US: isoToUs(q.departDate), RET_US: isoToUs(q.returnDate),
    CABIN_LABEL: q.cabinLabel, PAX_LABEL: paxLabel(q), PAX: q.adults + q.children + q.infants,
    ADULTS: q.adults, CHILDREN: q.children, INFANTS: q.infants, NONSTOP: q.nonStop ? 'true' : 'false',
    ROUND_CHECKED: round ? 'checked' : '', ONEWAY_CHECKED: round ? '' : 'checked',
    ROUND_SELECTED: round ? 'selected' : '', ONEWAY_SELECTED: round ? '' : 'selected',
    ECONOMY_CHECKED: q.cabinLabel === 'Economy' ? 'checked' : '',
    PREMIUM_CHECKED: q.cabinLabel === 'Premium Economy' ? 'checked' : '',
    BUSINESS_CHECKED: q.cabinLabel === 'Business' ? 'checked' : '',
    FIRST_CHECKED: q.cabinLabel === 'First' ? 'checked' : '',
  }));
});

// first page (and "load more" pages) of unfiltered results
app.get('/airline/flightResponse/:offset', asyncRoute(async (req, res) => {
  if (!req.session.search) return res.status(400).send('<div class="list_0"><div class="no-search"><h3>No Flights ! Restart Search.</h3></div></div>');
  const ctx = ctxFor(req.session.search);
  let entry;
  try {
    entry = await ensureOffers(req);
  } catch (err) {
    console.error('[search] provider error:', err.message);
    ctx.message = process.env.NODE_ENV === 'production' ? 'The flight supplier did not answer. Please try again.' : err.message;
    return res.type('html').send(render.list([], 0, ctx, true));
  }
  const offset = offsetOf(req.params.offset);
  const all = offersLib.apply(entry.offers, { sort: 'price_asc' });
  res.type('html').send(render.list(pageOf(all, offset), offset, ctx, offset === 0));
}));

app.get('/airline/getFilter', asyncRoute(async (req, res) => {
  if (!req.session.search) return res.status(400).send('');
  const entry = await ensureOffers(req);
  const st = offersLib.stats(entry.offers);
  res.type('html').send(render.filterSidebar(st, ctxFor(req.session.search), Math.min(cfg.pageSize, st.count)));
}));

app.get('/airline/getsortdata', asyncRoute(async (req, res) => {
  if (!req.session.search) return res.status(400).send('');
  const entry = await ensureOffers(req);
  // Use the currency the offers actually came back in (Duffel bills in the organisation's
  // currency and ignores CURRENCY), otherwise this bar would disagree with the cards.
  const currency = (entry.offers[0] && entry.offers[0].currency) || cfg.currency;
  res.type('html').send(render.sortBar(offersLib.stats(entry.offers), currency));
}));

// every filter / sort endpoint of the original results page maps onto offersLib.apply()
async function filtered(req, res, filters, offset) {
  if (!req.session.search) return res.status(400).send('');
  const entry = await ensureOffers(req);
  const ctx = ctxFor(req.session.search);
  const list = offersLib.apply(entry.offers, filters);
  res.type('html').send(render.list(pageOf(list, offset), offset, ctx, false));
}
const sortOf = (b) => offersLib.sortFromParams(b);

app.post('/airline/getairlineFilter', asyncRoute((req, res) => filtered(req, res,
  { airlines: req.body.val, sort: sortOf(req.body) }, offsetOf(req.body.i))));
app.post('/airline/getdepvalFilter', asyncRoute((req, res) => filtered(req, res,
  { dep: req.body.depval, sort: sortOf(req.body) }, offsetOf(req.body.i))));
app.post('/airline/getstopFilter', asyncRoute((req, res) => filtered(req, res,
  { stops: req.body.val, sort: sortOf(req.body) }, offsetOf(req.body.i))));
app.post('/airline/getpriceFilter', asyncRoute((req, res) => filtered(req, res,
  { min: req.body.min_price, max: req.body.max_price, sort: sortOf(req.body) }, offsetOf(req.body.i))));
app.post('/airline/resultsortdata', asyncRoute((req, res) => filtered(req, res,
  { sort: sortOf(req.body) }, offsetOf(req.body.i))));
app.post('/airline/getcombinationFilter', asyncRoute((req, res) => filtered(req, res,
  { stops: req.body.fval1, dep: req.body.fval2, airlines: req.body.fval3, sort: 'price_asc' }, 0)));
app.post(['/multiple_filter', '/airline/multiple_filter'], asyncRoute((req, res) => filtered(req, res, {
  airlines: req.body.airline, dep: req.body.departure, stops: req.body.stops,
  min: req.body.min_price, max: req.body.max_price, sort: sortOf(req.body),
}, offsetOf(req.body.i_f))));

/* ----------------------------------------------------------------- autocomplete & small AJAX endpoints */

// The original returns JSON as text/html and the front-end JSON.parse()s it — keep that contract.
app.post(withPrefixes('/flightname'), (req, res) => {
  res.type('html').send(JSON.stringify(data.searchAirports(req.body.name)));
});

app.post(withPrefixes('/preferairline'), (req, res) => {
  const items = data.searchAirlines(req.body.name)
    .map((a) => `<li id="lib"><a href=""> [${esc(a.code)}] ${esc(a.name)}</a></li>`).join('');
  res.type('html').send(items);
});

// geo default for the origin field (the original used the visitor's IP; here: DEFAULT_ORIGIN or "false")
app.get(withPrefixes('/city'), (req, res) => {
  // 404 (not "false") so jQuery takes the error branch: the original success handler reads data[0].code
  if (!cfg.defaultOrigin) return res.status(404).json(false);
  const a = data.airport(cfg.defaultOrigin);
  res.json([{ code: a.code, cityName: a.city, countryName: a.country.toUpperCase() }]);
});

app.post(withPrefixes('/ultimatorurl'), (req, res) => {
  req.session.currency = String(req.body.coCode || cfg.currency).toUpperCase();
  res.send('ok');
});

app.post(withPrefixes('/applucoupon'), (req, res) => {
  const c = pricing.findCoupon(req.body.name);
  if (!c) return res.type('html').send('400');
  res.type('html').send(JSON.stringify({ value: { couponname: c.couponname, coupontype: c.coupontype, couponpercent: c.couponpercent } }));
});

// lead-capture endpoints (contact form, call-back widgets). Leads are written to data/leads/*.json —
// plug your CRM / SMTP transport into saveLead() when you go live.
function saveLead(kind, req) {
  const lead = { kind, at: new Date().toISOString(), ip: req.ip, page: req.get('referer') || '', data: req.body };
  store.saveRecord(cfg.leadsDir, `${Date.now()}-${kind}.json`, lead);
  store.forward(kind, lead);
  console.log(`[lead] ${kind}`, JSON.stringify(req.body));
}
app.post(withPrefixes('/sendmail'), (req, res) => { saveLead('contact', req); res.send('<div class="alert alert-success">Thank you! Your message has been sent. We will get back to you shortly.</div>'); });
app.post(withPrefixes('/quickcallrequest'), (req, res) => { saveLead('quick-call', req); res.send('Thank you! Our travel expert will call you back in a few minutes.'); });
app.post(withPrefixes('/thankyouuser'), (req, res) => { saveLead('call-back', req); res.send('Thank you! We will call you shortly.'); });
app.post(withPrefixes('/couponthanks'), (req, res) => { saveLead('coupon', req); res.send('Thank you! Your discount code has been sent.'); });

/* ----------------------------------------------------------------- booking */

async function bookingPage(req, res) {
  const q = req.session.search;
  if (!q) return res.redirect('/');
  const offer = await findOffer(req, req.body.offer_id, q);
  if (!offer) return res.redirect('/airline/searchflight');
  const ctx = ctxFor(q);
  let fare = pricing.applyPricing(offer.price, q);
  let confirmed = null;
  if (providers.name !== 'amadeus' || cfg.amadeus.confirmPrice) {
    try {
      confirmed = await providers.price(offer);
      if (confirmed && confirmed.total) {
        fare = pricing.applyPricing({ ...offer.price, total: confirmed.total }, q);
      }
    } catch (err) {
      console.error('[booking] price confirmation failed, using search price:', err.message);
    }
  }
  // Only small scalars go into the session: it is a signed cookie, so the supplier's raw
  // confirmation payload must not be carried here. bookingId is kept because TripJack needs it
  // to issue the ticket later.
  req.session.booking = {
    offerId: offer.id,
    fare,
    confirmed: confirmed
      ? { total: confirmed.total, bookingId: (confirmed.raw && confirmed.raw.bookingId) || null }
      : null,
  };
  const round = offer.itineraries.length > 1;
  res.type('html').send(tpl.render(round ? 'airline/returnbooking.html' : 'airline/booking.html', {
    ADULTS: q.adults, CHILDREN: q.children, INFANTS: q.infants,
    MAIN_DURATION: fmtDur(offer.itineraries[0].duration),
    ITINERARY: render.bookingItinerary(offer, ctx, fare),
    BAGGAGE: render.bookingBaggage(offer, ctx),
    FARE_MOBILE_PAX: render.bookingFareMobileAndPax(offer, ctx, fare),
    FARE_SIDEBAR: render.bookingFareSidebar(offer, ctx, fare),
    BOOKING_SCRIPT: render.bookingScript(ctx),
  }));
}
app.post('/airline/booking', asyncRoute(bookingPage));
app.post('/airline/returnbooking', asyncRoute(bookingPage));
app.get(['/airline/booking', '/airline/returnbooking', '/airline/deleteTripjackCollection'], (req, res) => res.redirect('/airline/searchflight'));

function collectPassengers(body) {
  const out = [];
  const bd = body.booking_data || {};
  const push = (type, label) => {
    const arr = Array.isArray(bd[type]) ? bd[type] : Object.values(bd[type] || {});
    arr.forEach((p) => { if (p && (p.firstname || p.lastname)) out.push({ type: label, ...p }); });
  };
  push('madult', 'Adult'); push('mchildren', 'Child'); push('minfant', 'Infant');
  return out;
}

async function confirmBooking(req, res) {
  const q = req.session.search;
  const bk = req.session.booking;
  const offer = q && bk ? await findOffer(req, bk.offerId, q) : null;
  if (!q || !offer) return res.redirect('/airline/searchflight');
  const passengers = collectPassengers(req.body);
  const contact = {
    firstname: (passengers[0] || {}).firstname || '', email: req.body.email || '', mobile: req.body.mobile || '',
    address_one: req.body.address_one || '', address_two: req.body.address_two || '',
    country: req.body.country || '', state: req.body.state || '', city: req.body.city || '', pincode: req.body.pincode || '',
  };
  if (!passengers.length || !contact.email || !contact.mobile) return res.redirect(307, offer.itineraries.length > 1 ? '/airline/returnbooking' : '/airline/booking');
  const ref = 'XF' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  const { raw, ...offerNoRaw } = offer;
  const record = {
    ref, at: new Date().toISOString(), provider: providers.name, search: q, fare: bk.fare, confirmed: bk.confirmed,
    offer: offerNoRaw, supplierRef: raw && (raw.priceIds || raw.id) ? (raw.priceIds || raw.id) : undefined,
    passengers, contact, coupon: req.body.coupon_value || '', ip: req.ip,
  };
  store.saveRecord(cfg.bookingsDir, `${ref}.json`, record);
  store.forward('booking', record);
  console.log(`[booking] ${ref} ${q.origin}-${q.destination} ${offer.currency} ${money(bk.fare.grandTotal)} ${contact.email}`);
  // NOTE: ticket issuance (Amadeus Flight Create Orders / TripJack oms/v1/air/book) is intentionally not
  // automated here — the original site works as a call-centre lead flow. Hook it in here if you get a
  // ticketing contract with the supplier.
  delete req.session.booking;
  res.type('html').send(tpl.render('airline/thankyou.html', {
    CONTENT: render.thankYou({ ref, offer, fare: bk.fare, passengers, contact, ctx: ctxFor(q) }),
  }));
}
app.post(['/confirmbooking', '/returnbookingthanks', '/airline/confirmbooking', '/airline/returnbookingthanks'], asyncRoute(confirmBooking));

/* ----------------------------------------------------------------- mirrored pages by slug */

const SLUG = /^[a-z0-9][a-z0-9-]{0,80}$/;
app.get('/tour/:slug', (req, res, next) => {
  if (!SLUG.test(req.params.slug) || !tpl.exists(`tour/${req.params.slug}.html`)) return next();
  sendPage(res, `tour/${req.params.slug}.html`);
});
app.get('/:slug', (req, res, next) => {
  if (!SLUG.test(req.params.slug) || !tpl.exists(`${req.params.slug}.html`)) return next();
  sendPage(res, `${req.params.slug}.html`);
});

// the original answers unknown URLs with the home page; do the same but with a proper 404 status
app.use((req, res) => sendPage(res, 'index.html', 404));

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).type('text').send('Internal error: ' + (process.env.NODE_ENV === 'production' ? '' : err.message));
});

// Exported so a serverless host (api/index.js on Vercel) can mount the same app; only a direct
// `node server.js` opens a port.
module.exports = app;

if (require.main === module) {
  app.listen(cfg.port, () => {
    console.log(`${cfg.site.name} listening on http://localhost:${cfg.port}  (provider: ${cfg.provider}, currency: ${cfg.currency})`);
  });
}
