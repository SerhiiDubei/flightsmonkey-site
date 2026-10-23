'use strict';
/**
 * Copy check: holes and seams in the text a visitor reads.
 *
 *   node tests/copy.test.js                       -> against http://localhost:3000
 *   BASE_URL=https://... node tests/copy.test.js  -> against a deployment
 *
 * Every rule here is a fault that shipped and that the layout checks could
 * not see, because a sentence with a hole in it still fits its box:
 *
 *   path-as-text     "Search from the box at the top of / , pick…" — the
 *                    mirror rewrote the reference site's URL to "/" in the
 *                    link text as well as in the href
 *   space-before     "(each passenger) ." / "Note : bring…"
 *   glued-label      "<strong>Banff, Alberta:</strong>Banff sits…" reads
 *                    "Alberta:Banff" — the label runs into its own text
 *   placeholder      a {{KEY}} the server did not fill
 *   points-nowhere   "call the number above" — there is no number above on
 *                    a desktop screen, only in the footer; "use the search
 *                    form at the top of the page" on a page that has none
 *
 * The text is taken from the rendered HTML with inline tags dropped and
 * block tags turned into line breaks, which is how it reads on the page.
 * Collapsed panels count: an FAQ answer is text a visitor will open.
 */
const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

const PAGES = ['/', '/about', '/contact', '/faq', '/destinations', '/how-to-book', '/hotel-booking-tips',
  '/charges-fees', '/privacy', '/cookie', '/terms-condition', '/refund-cancellation',
  '/canada', '/singapore', '/qatar',
  '/alaska-flights', '/alaska-flight-tickets', '/hawaii-flights', '/hawai-flight-tickets', '/singapore-flights',
  '/explore-toronto', '/explore-vancouver', '/explore-montreal', '/explore-halifax', '/explore-niagara-falls',
  '/discover-miami', '/discover-costa-rica', '/fly-to-bangkok', '/fly-to-mexico', '/fly-to-montreal',
  '/mexican-celebration',
  '/tour/atlantic-canada', '/tour/canadian-eastcoast', '/tour/niagara-falls-package',
  '/tour/phuket-celebration', '/tour/request-quote'];

const INLINE = 'a|abbr|b|em|font|i|label|small|spam|span|strong|sub|sup|u';

// Enough named entities for the accented names these pages use
// ("Restaurant Andr&eacute;:") — an undecoded one hides the letter a rule
// needs to see.
const ENTITIES = { nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…', eacute: 'é', egrave: 'è', aacute: 'á',
  agrave: 'à', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', ccedil: 'ç', uuml: 'ü', ouml: 'ö', auml: 'ä' };

/** HTML -> the lines of text a reader sees. */
function readable(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, '')
    .replace(new RegExp(`</?(?:${INLINE})\\b[^>]*>`, 'gi'), '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in ENTITIES ? ENTITIES[n.toLowerCase()] : m))
    .split('\n')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

const TEXT_RULES = [
  ['space-before', /[A-Za-z0-9)\]*]\s+[,;:!?](?=\s|$)|[A-Za-z0-9)\]]\s+\.(?=\s|$)/],
  ['glued-label', /[\p{Ll})]:[\p{Lu}\d]/u],
  ['placeholder', /\{\{|\}\}|\bundefined\b|\[object /],
  ['points-nowhere', /\bnumber (?:above|at the top)\b/i],
];

let passed = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { failures.push(`${name}${detail ? ' — ' + detail : ''}`); console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`); }
}

(async () => {
  console.log(`Тестую тексти на ${BASE}\n`);
  for (const path of PAGES) {
    const res = await fetch(BASE + path);
    const html = await res.text();
    const found = [];

    // A link whose visible text is a bare path.
    for (const m of html.matchAll(/<a\b[^>]*>\s*(\/[^<\s]*)\s*<\/a>/gi)) found.push(`path-as-text "${m[1]}"`);

    const rules = /id="searchbox/.test(html) ? TEXT_RULES
      : [...TEXT_RULES, ['points-nowhere', /\bsearch (?:form|box) at the top of (?:the|this) page\b/i]];

    for (const line of readable(html)) {
      for (const [rule, re] of rules) {
        const m = line.match(re);
        if (m) {
          const at = Math.max(0, m.index - 40);
          found.push(`${rule} "…${line.slice(at, m.index + 40)}…"`);
        }
      }
    }
    check(path, res.status === 200 && found.length === 0,
      res.status !== 200 ? `HTTP ${res.status}` : `${found.length}: ${found.slice(0, 3).join(' | ')}`);
  }

  console.log(`\nПройдено: ${passed} | Провалено: ${failures.length}`);
  if (failures.length) process.exit(1);
  console.log('Усі перевірки пройдено.');
})().catch((e) => { console.error('\nТЕСТ ВПАВ:', e); process.exit(1); });
