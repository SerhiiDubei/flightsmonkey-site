'use strict';
/**
 * HTTP test suite: pages, AJAX endpoints, the full booking flow, edge cases and latency.
 *
 *   node tests/http.test.js                       -> against http://localhost:3000
 *   BASE_URL=https://... node tests/http.test.js  -> against a deployment
 *
 * Exits non-zero if any check fails, so it can gate a deploy.
 */
const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const TIMEOUT = Number(process.env.TEST_TIMEOUT) || 90000;

let passed = 0; const failures = []; const timings = [];

function check(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { failures.push(`${name}${detail ? ' — ' + detail : ''}`); console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`); }
  return !!cond;
}

function section(t) { console.log(`\n=== ${t} ===`); }

/** fetch with timing; keeps a cookie jar so the session survives across calls */
class Session {
  constructor() { this.cookie = ''; }
  async req(path, { method = 'GET', form, headers = {}, label } = {}) {
    const url = path.startsWith('http') ? path : BASE + path;
    const opts = { method, headers: { ...headers }, redirect: 'manual' };
    if (this.cookie) opts.headers.Cookie = this.cookie;
    if (form) {
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      opts.body = new URLSearchParams(form).toString();
    }
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT);
    opts.signal = ac.signal;
    const t0 = Date.now();
    let res;
    try { res = await fetch(url, opts); } finally { clearTimeout(timer); }
    const ms = Date.now() - t0;
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const pair = setCookie.split(';')[0];
      this.cookie = pair; // single-cookie session
    }
    const body = await res.text();
    timings.push({ label: label || `${method} ${path}`, ms });
    return { status: res.status, body, ms, location: res.headers.get('location'), type: res.headers.get('content-type') || '' };
  }
}

const PAGES = ['/', '/about', '/contact', '/destinations', '/privacy', '/cookie', '/charges-fees',
  '/terms-condition', '/refund-cancellation', '/faq', '/how-to-book',
  '/hotel-booking-tips', '/explore-niagara-falls', '/discover-miami', '/fly-to-montreal',
  '/explore-halifax', '/fly-to-mexico', '/fly-to-bangkok', '/discover-costa-rica',
  '/mexican-celebration', '/alaska-flights', '/hawaii-flights', '/singapore-flights',
  '/alaska-flight-tickets', '/canada', '/explore-montreal', '/explore-toronto', '/explore-vancouver',
  '/hawai-flight-tickets', '/qatar', '/singapore', '/tour/atlantic-canada', '/tour/canadian-eastcoast',
  '/tour/phuket-celebration', '/tour/niagara-falls-package', '/tour/request-quote'];

// what the mirrored calendar actually posts: TWO-digit year, weekday names in dp_date/ar_date
const CAL = (o) => ({
  triptype: 'round', origin: 'JFK', destination: 'LAX',
  depart_date: '11/20/26', return_date: '11/27/26',
  dp_date: 'Friday', ar_date: 'Friday',
  adult: '1', child: '0', infant: '0', class_type: 'Economy', ...o,
});

async function testPages() {
  section('Сторінки (37)');
  for (const p of PAGES) {
    const r = await new Session().req(p, { label: `page ${p}` });
    const ok = r.status === 200 && r.body.length > 2000;
    check(`${p}`, ok, ok ? '' : `status=${r.status} size=${r.body.length}`);
    if (ok) {
      check(`${p} без незаповнених {{`, !/\{\{[A-Z_]+\}\}/.test(r.body));
      check(`${p} має футер`, /<footer/i.test(r.body));
    }
  }
}

async function testMisc() {
  section('Службові маршрути');
  const s = new Session();
  const r404 = await s.req('/definitely-not-a-page-xyz');
  check('невідомий слаг -> 404', r404.status === 404, `status=${r404.status}`);
  const rob = await s.req('/robots.txt');
  check('robots.txt', rob.status === 200 && /User-agent/i.test(rob.body));
  const sm = await s.req('/sitemap.xml');
  check('sitemap.xml', sm.status === 200 && /<urlset/.test(sm.body));
  const sitemapCount = (sm.body.match(/<loc>/g) || []).length;
  check(`sitemap має >=30 URL (${sitemapCount})`, sitemapCount >= 30);
}

async function testAutocomplete() {
  section('Автокомпліт');
  const s = new Session();
  const fn = await s.req('/flightname', { method: 'POST', form: { name: 'lond' } });
  let json = null;
  try { json = JSON.parse(fn.body); } catch (_) { /* leave null */ }
  check('/flightname повертає JSON', !!json && Array.isArray(json.record2), `status=${fn.status}`);
  if (json) {
    check('/flightname знаходить London (LHR)', json.record2.some((a) => a.code === 'LHR'));
    check('/flightname має поля code/cityname/countryname',
      json.record2.every((a) => a.code && a.cityname !== undefined && a.countryname !== undefined));
  }
  const short = await s.req('/flightname', { method: 'POST', form: { name: 'a' } });
  const shortJson = JSON.parse(short.body || '{}');
  check('однобуквений запит не падає', short.status === 200 && Array.isArray(shortJson.record2 || []));

  const pa = await s.req('/preferairline', { method: 'POST', form: { name: 'luft' } });
  check('/preferairline знаходить Lufthansa', pa.status === 200 && /Lufthansa/.test(pa.body));

  for (const prefix of ['', '/airline', '/tour']) {
    const r = await s.req(`${prefix}/flightname`, { method: 'POST', form: { name: 'paris' } });
    check(`/flightname працює під префіксом "${prefix || '/'}"`, r.status === 200 && /CDG|Paris/i.test(r.body));
  }
}

async function testLeads() {
  section('Ліди та купони');
  const s = new Session();
  const mail = await s.req('/sendmail', { method: 'POST', form: { name: 'QA', email: 'qa@example.com', subject: 'x', message: 'y' } });
  check('/sendmail приймає заявку', mail.status === 200 && /Thank you/i.test(mail.body));
  const call = await s.req('/quickcallrequest', { method: 'POST', form: { phone: '4165550000' } });
  check('/quickcallrequest приймає заявку', call.status === 200 && /Thank you/i.test(call.body));
  const bad = await s.req('/applucoupon', { method: 'POST', form: { name: 'NOPE' } });
  check('невалідний купон -> 400-маркер', bad.body.trim() === '400', `body=${bad.body.slice(0, 40)}`);
  const good = await s.req('/applucoupon', { method: 'POST', form: { name: 'xtreme10' } });
  check('валідний купон повертає JSON', /couponname/.test(good.body));
}

async function testSearchFlow() {
  section('Пошук і бронювання (round trip, формат календаря)');
  const s = new Session();
  const post = await s.req('/airline/searchflight', { method: 'POST', form: CAL({ adult: '2', child: '1' }), label: 'search POST' });
  if (!check('POST пошуку -> 303 редирект', post.status === 303, `status=${post.status} loc=${post.location}`)) return null;

  const page = await s.req('/airline/searchflight', { label: 'results page' });
  check('сторінка результатів 200', page.status === 200);
  check('заголовок JFK TO LAX', /JFK TO LAX/.test(page.body));
  check('кількість пасажирів = 3', /3\s+Passenger\(s\)/.test(page.body));
  check('немає незаповнених {{', !/\{\{[A-Z_]+\}\}/.test(page.body));

  const fr = await s.req('/airline/flightResponse/0', { label: 'flightResponse/0' });
  const cards = (fr.body.match(/<form/g) || []).length;
  check(`перша сторінка: 10 карток (${cards})`, cards === 10);
  check('обгортка list_0', /class="list_0"/.test(fr.body));
  check('є ціни', /id="res-price">/.test(fr.body));
  check('round trip: два плечі', /result-nav second/.test(fr.body));

  const fr10 = await s.req('/airline/flightResponse/10', { label: 'flightResponse/10' });
  check('друга сторінка: обгортка list_10', /class="list_10"/.test(fr10.body));
  check('друга сторінка має картки', (fr10.body.match(/<form/g) || []).length > 0);

  const filt = await s.req('/airline/getFilter', { label: 'getFilter' });
  const total = (filt.body.match(/mainresultcountvar">(\d+)/) || [])[1];
  check(`сайдбар фільтрів, всього ${total}`, filt.status === 200 && Number(total) > 0);
  check('фільтр авіакомпаній не порожній', /name="airlines"/.test(filt.body));
  check('фільтр пересадок не порожній', /mystopsradio/.test(filt.body));
  check('є повзунок ціни', /js-range-slider/.test(filt.body));

  const sort = await s.req('/airline/getsortdata', { label: 'getsortdata' });
  check('блок Earliest/Cheapest/Fastest', /earliest_value/.test(sort.body) && /cheapest_value/.test(sort.body) && /shortest_value/.test(sort.body));

  // валюта має збігатись між карткою і сорт-баром
  const cardCur = (fr.body.match(/id="res-price">\s*([A-Z]{3})/) || [])[1];
  const sortCur = (sort.body.match(/ovpricechepest">\s*([A-Z]{3})/) || [])[1];
  check(`валюта однакова в картці і сорт-барі (${cardCur} / ${sortCur})`, cardCur && cardCur === sortCur);

  section('Фільтри та сортування');
  const airline = (filt.body.match(/name="airlines" id="check_0"/) && filt.body.match(/value="([A-Z0-9]{2})" name="airlines"/) || [])[1];
  if (airline) {
    const f = await s.req('/airline/getairlineFilter', { method: 'POST', form: { 'val[]': airline, sortval: '2', i: '0' }, label: 'filter airline' });
    check(`фільтр по авіакомпанії ${airline}`, f.status === 200 && (f.body.match(/<form/g) || []).length > 0);
  }
  const stops = await s.req('/airline/getstopFilter', { method: 'POST', form: { val: '0', sortval: '2', i: '0' }, label: 'filter stops' });
  check('фільтр "без пересадок"', stops.status === 200);
  const dep = await s.req('/airline/getdepvalFilter', { method: 'POST', form: { depval: '06-12', sortval: '2', i: '0' }, label: 'filter dep' });
  check('фільтр часу вильоту 06-12', dep.status === 200);
  const price = await s.req('/airline/getpriceFilter', { method: 'POST', form: { min_price: '0', max_price: '99999', sortval: '2', i: '0' }, label: 'filter price' });
  check('фільтр ціни (широкий діапазон дає картки)', (price.body.match(/<form/g) || []).length > 0);
  const multi = await s.req('/multiple_filter', { method: 'POST', form: { departure: '', stops: '', sortval: '2', i_f: '0', min_price: '', max_price: '' }, label: 'multiple_filter' });
  check('комбінований фільтр', multi.status === 200);

  const asc = await s.req('/airline/resultsortdata', { method: 'POST', form: { vc: 'LowerPrice', sortval: '2', i: '0' }, label: 'sort asc' });
  const desc = await s.req('/airline/resultsortdata', { method: 'POST', form: { vc: 'HighPrice', sortval: '1', i: '0' }, label: 'sort desc' });
  const num = (b) => Number(((b.match(/id="res-price">\s*[A-Z]{3}\s*([\d.]+)/) || [])[1]) || 0);
  const lo = num(asc.body); const hi = num(desc.body);
  check(`сортування: найдешевший ${lo} <= найдорожчий ${hi}`, lo > 0 && hi > 0 && lo <= hi);

  section('Бронювання');
  const offerId = (fr.body.match(/name="offer_id" value="([^"]+)"/) || [])[1];
  check('у картці є offer_id', !!offerId);
  if (!offerId) return null;
  const bk = await s.req('/airline/returnbooking', { method: 'POST', form: { offer_id: offerId }, label: 'booking page' });
  check('сторінка бронювання 200', bk.status === 200, `status=${bk.status}`);
  check('немає незаповнених {{', !/\{\{[A-Z_]+\}\}/.test(bk.body));
  check('форма paymentFrm', /id="paymentFrm"/.test(bk.body));
  check('2 дорослих у формі', /booking_data\[madult\]\[1\]\[firstname\]/.test(bk.body));
  check('1 дитина у формі', /booking_data\[mchildren\]\[0\]\[firstname\]/.test(bk.body));
  check('є блок багажу', /baggagebx/.test(bk.body));
  check('є таймер сесії', /class="countdown"/.test(bk.body));
  check('є згода з умовами', /id="tnc"/.test(bk.body));
  check('є підсумкова сума', /grandTotal/.test(bk.body));

  const conf = await s.req('/returnbookingthanks', {
    method: 'POST',
    label: 'confirm',
    form: {
      'booking_data[madult][0][title]': 'Mr', 'booking_data[madult][0][firstname]': 'Auto',
      'booking_data[madult][0][lastname]': 'Test', 'booking_data[madult][0][dob]': '01/01/1990',
      'booking_data[madult][1][firstname]': 'Second', 'booking_data[madult][1][lastname]': 'Test',
      'booking_data[mchildren][0][firstname]': 'Kid', 'booking_data[mchildren][0][lastname]': 'Test',
      email: 'qa@example.com', mobile: '4165550000', address_one: '1 QA St', country: 'Canada', tandc: 'on',
    },
  });
  check('підтвердження 200', conf.status === 200, `status=${conf.status}`);
  check('видано номер заявки', /XF[A-Z0-9]+/.test(conf.body));
  check('показано ім\'я пасажира', /Auto\s+Test/.test(conf.body));
  return { offerId };
}

async function testOneWay() {
  section('One way');
  const s = new Session();
  const post = await s.req('/airline/searchflight', {
    method: 'POST', label: 'oneway search',
    form: { triptype: 'oneway', origin: 'LHR', destination: 'CDG', depart_date: '12/05/26', dp_date: 'Saturday', adult: '1' },
  });
  check('POST -> 303', post.status === 303, `status=${post.status}`);
  const fr = await s.req('/airline/flightResponse/0', { label: 'oneway flightResponse' });
  check('є картки', (fr.body.match(/<form/g) || []).length > 0);
  check('форма веде на /airline/booking', /action="\/airline\/booking"/.test(fr.body));
  check('немає зворотного плеча', !/result-nav second/.test(fr.body));
  const offerId = (fr.body.match(/name="offer_id" value="([^"]+)"/) || [])[1];
  if (offerId) {
    const bk = await s.req('/airline/booking', { method: 'POST', form: { offer_id: offerId }, label: 'oneway booking' });
    check('сторінка бронізації one way', bk.status === 200 && /paymentFrm/.test(bk.body));
    check('у зведенні "One Way"', /One Way/.test(bk.body));
  }
}

async function testEdgeCases() {
  section('Граничні випадки');
  const s = new Session();

  const noDates = await s.req('/airline/searchflight', { method: 'POST', form: { triptype: 'round', origin: 'JFK', destination: 'LAX', adult: '1' } });
  check('без дат -> редирект на головну', noDates.status === 302 && /\/$/.test(noDates.location || ''), `status=${noDates.status}`);

  const fourDigit = await s.req('/airline/searchflight', { method: 'POST', form: CAL({ depart_date: '11/20/2026', return_date: '11/27/2026' }) });
  check('рік 4 цифри теж приймається', fourDigit.status === 303, `status=${fourDigit.status}`);

  const past = await s.req('/airline/searchflight', { method: 'POST', form: CAL({ depart_date: '01/10/20', return_date: '01/17/20' }) });
  check('дата в минулому не ламає (підтягується сьогодні)', past.status === 303);

  const fresh = new Session();
  const noSession = await fresh.req('/airline/flightResponse/0');
  check('flightResponse без сесії -> 400 і зрозуміле повідомлення',
    noSession.status === 400 && /No Flights/.test(noSession.body), `status=${noSession.status}`);

  const fresh2 = new Session();
  const bookNoSession = await fresh2.req('/airline/returnbooking', { method: 'POST', form: { offer_id: 'duffel:off_bogus' } });
  check('бронювання без сесії -> редирект, не 500', bookNoSession.status === 302, `status=${bookNoSession.status}`);

  const s3 = new Session();
  await s3.req('/airline/searchflight', { method: 'POST', form: CAL({}) });
  const bogus = await s3.req('/airline/returnbooking', { method: 'POST', form: { offer_id: 'duffel:off_0000DOESNOTEXIST' } });
  check('неіснуючий offer_id -> редирект, не 500', bogus.status === 302 || bogus.status === 303, `status=${bogus.status}`);

  const getBooking = await s3.req('/airline/booking');
  check('GET на booking -> редирект', getBooking.status === 302, `status=${getBooking.status}`);
}

function reportLatency() {
  section('Латенсі');
  const byLabel = new Map();
  for (const t of timings) {
    if (!byLabel.has(t.label)) byLabel.set(t.label, []);
    byLabel.get(t.label).push(t.ms);
  }
  const rows = [];
  for (const [label, arr] of byLabel) {
    arr.sort((a, b) => a - b);
    rows.push({ label, n: arr.length, min: arr[0], med: arr[Math.floor(arr.length / 2)], max: arr[arr.length - 1] });
  }
  rows.sort((a, b) => b.max - a.max);
  console.log('  ' + 'запит'.padEnd(42) + 'n'.padStart(3) + 'min'.padStart(8) + 'med'.padStart(8) + 'max'.padStart(8));
  for (const r of rows.slice(0, 18)) {
    console.log('  ' + r.label.slice(0, 41).padEnd(42) + String(r.n).padStart(3)
      + String(r.min + 'ms').padStart(8) + String(r.med + 'ms').padStart(8) + String(r.max + 'ms').padStart(8));
  }
  const all = timings.map((t) => t.ms).sort((a, b) => a - b);
  const p = (q) => all[Math.min(all.length - 1, Math.floor(all.length * q))];
  console.log(`\n  всього запитів ${all.length} | p50 ${p(0.5)}ms | p90 ${p(0.9)}ms | p95 ${p(0.95)}ms | max ${all[all.length - 1]}ms`);
  const slow = rows.filter((r) => r.max > 10000);
  check(`жоден запит не довший за 10с (найповільніший ${rows[0] ? rows[0].max : 0}ms)`, slow.length === 0,
    slow.map((r) => `${r.label}=${r.max}ms`).join(', '));
}

(async () => {
  console.log(`Тестую ${BASE}\n`);
  const t0 = Date.now();
  await testPages();
  await testMisc();
  await testAutocomplete();
  await testLeads();
  await testSearchFlow();
  await testOneWay();
  await testEdgeCases();
  reportLatency();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Пройдено: ${passed} | Провалено: ${failures.length} | Час: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (failures.length) {
    console.log('\nПРОВАЛЕНІ ПЕРЕВІРКИ:');
    failures.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('Усі перевірки пройдено.');
})().catch((e) => { console.error('\nТЕСТ ВПАВ:', e); process.exit(1); });
