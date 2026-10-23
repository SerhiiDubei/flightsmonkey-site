'use strict';
/**
 * DOM contract test: the markup may be rewritten, the booking engine may not break.
 *
 *   node tests/contract.test.js            -> check pages against the recorded baseline
 *   node tests/contract.test.js --record   -> record the baseline from the current pages
 *
 * Why this exists
 * ---------------
 * public/ajax/search.js is 119 KB of inherited jQuery that we are deliberately NOT
 * rewriting. It reaches into the markup by id, name and class — 267 distinct hooks
 * at last count. Rewriting the HTML around it is safe only as long as every hook it
 * grabs is still there afterwards.
 *
 * The failure this prevents is the quiet kind: the page renders, the form looks
 * right, and the date picker simply never opens because the id it binds to was
 * renamed. Nothing throws, no test goes red, and you find out from a customer.
 *
 * So: snapshot which hooks exist on which page while the old markup still works,
 * then assert the new markup still offers all of them. A hook the JS references but
 * that exists on no page is dead code in search.js and is not recorded — the
 * baseline only ever contains hooks that were genuinely live.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'pages');
const JS_DIR = path.join(ROOT, 'public', 'ajax');
const BASELINE = path.join(__dirname, 'dom-contract.json');

const RECORD = process.argv.includes('--record');

/* ---------- collect the hooks the inherited JS reaches for ---------- */

function jsHooks() {
  const ids = new Set();
  const classes = new Set();
  const names = new Set();

  for (const f of fs.readdirSync(JS_DIR)) {
    if (!f.endsWith('.js')) continue;
    const src = fs.readFileSync(path.join(JS_DIR, f), 'utf8');

    // getElementById('x') / getElementsByName('x')
    for (const m of src.matchAll(/getElementById\(\s*['"]([^'"]+)['"]/g)) ids.add(m[1]);
    for (const m of src.matchAll(/getElementsByName\(\s*['"]([^'"]+)['"]/g)) names.add(m[1]);
    for (const m of src.matchAll(/getElementsByClassName\(\s*['"]([^'"]+)['"]/g)) classes.add(m[1]);

    // $('#x'), $('.x'), $('[name="x"]'), querySelector('#x') — first simple token only
    const sel = /(?:\$\(|querySelector(?:All)?\()\s*['"]([^'"]{1,80})['"]/g;
    for (const m of src.matchAll(sel)) {
      const s = m[1].trim();
      for (const idm of s.matchAll(/#([A-Za-z][\w-]*)/g)) ids.add(idm[1]);
      for (const cm of s.matchAll(/\.([A-Za-z][\w-]*)/g)) classes.add(cm[1]);
      for (const nm of s.matchAll(/\[name=['"]?([\w[\]-]+)['"]?\]/g)) names.add(nm[1]);
    }
  }
  return { ids: [...ids].sort(), classes: [...classes].sort(), names: [...names].sort() };
}

/* ---------- collect what a page actually offers ---------- */

function pageOffers(html) {
  const ids = new Set();
  const classes = new Set();
  const names = new Set();
  for (const m of html.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)) ids.add(m[1].trim());
  for (const m of html.matchAll(/\bname\s*=\s*["']([^"']+)["']/g)) names.add(m[1].trim());
  for (const m of html.matchAll(/\bclass\s*=\s*["']([^"']+)["']/g)) {
    for (const c of m[1].trim().split(/\s+/)) if (c) classes.add(c);
  }
  return { ids, classes, names };
}

function allPages() {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push(path.relative(PAGES_DIR, p));
    }
  };
  walk(PAGES_DIR);
  return out.sort();
}

/* ---------- build the live map: page -> hooks present on it ---------- */

function buildMap() {
  const wanted = jsHooks();
  const map = {};
  for (const rel of allPages()) {
    const html = fs.readFileSync(path.join(PAGES_DIR, rel), 'utf8');
    const has = pageOffers(html);
    const hit = {
      ids: wanted.ids.filter((x) => has.ids.has(x)),
      classes: wanted.classes.filter((x) => has.classes.has(x)),
      names: wanted.names.filter((x) => has.names.has(x)),
    };
    if (hit.ids.length || hit.classes.length || hit.names.length) map[rel] = hit;
  }
  return { wanted, map };
}

/* ---------- record or verify ---------- */

const { wanted, map } = buildMap();

if (RECORD) {
  const total = Object.values(map).reduce(
    (n, h) => n + h.ids.length + h.classes.length + h.names.length, 0);
  const live = new Set();
  for (const h of Object.values(map)) {
    h.ids.forEach((x) => live.add('#' + x));
    h.classes.forEach((x) => live.add('.' + x));
    h.names.forEach((x) => live.add('@' + x));
  }
  fs.writeFileSync(BASELINE, JSON.stringify({
    recordedAt: new Date().toISOString().slice(0, 10),
    note: 'Hooks public/ajax/*.js binds that were live in the markup when recorded. '
        + 'Rewriting markup must not drop any of these. Regenerate only if you '
        + 'deliberately removed a feature — never to make a red test go green.',
    referencedByJs: wanted.ids.length + wanted.classes.length + wanted.names.length,
    liveHooks: live.size,
    pageBindings: total,
    map,
  }, null, 2) + '\n');
  console.log(`Записано ${BASELINE}`);
  console.log(`  JS посилається на:       ${wanted.ids.length + wanted.classes.length + wanted.names.length}`);
  console.log(`  з них живих у розмітці:  ${live.size}`);
  console.log(`  прив'язок сторінка×хук:  ${total}`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE)) {
  console.error(`Немає ${BASELINE}. Спочатку: node tests/contract.test.js --record`);
  process.exit(1);
}

const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
const failures = [];
let checked = 0;

for (const [rel, want] of Object.entries(base.map)) {
  const file = path.join(PAGES_DIR, rel);
  if (!fs.existsSync(file)) {
    failures.push(`${rel}: сторінка зникла, а на ній трималось ${want.ids.length} id`);
    continue;
  }
  const has = pageOffers(fs.readFileSync(file, 'utf8'));
  for (const kind of ['ids', 'classes', 'names']) {
    const sigil = { ids: '#', classes: '.', names: '@' }[kind];
    for (const hook of want[kind]) {
      checked++;
      if (!has[kind].has(hook)) failures.push(`${rel}: загублено ${sigil}${hook}`);
    }
  }
}

console.log(`\n=== Контракт розмітки з search.js ===\n`);
console.log(`Знято зліпок:  ${base.recordedAt}`);
console.log(`Перевірено:    ${checked} прив'язок на ${Object.keys(base.map).length} сторінках`);

if (failures.length) {
  console.log(`\nВТРАЧЕНО ${failures.length}:\n`);
  for (const f of failures.slice(0, 60)) console.log(`  FAIL  ${f}`);
  if (failures.length > 60) console.log(`  ... ще ${failures.length - 60}`);
  console.log(`\nНова розмітка загубила хуки, за які тримається search.js.`);
  console.log(`Бронювання зламається мовчки. Поверніть ці id або name.\n`);
  process.exit(1);
}

console.log(`Втрачено:      0\n`);
console.log(`Усі хуки, за які тримається search.js, на місці.`);
