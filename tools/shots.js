'use strict';
/**
 * Screenshot the states a page only reaches after a click.
 *
 *   npm install --no-save puppeteer
 *   node tools/shots.js                     -> against http://localhost:3000
 *   BASE_URL=https://... node tools/shots.js
 *
 * Why this exists
 * ---------------
 * The stylesheet rewrite was checked by measuring every element on every page
 * at six widths: nothing overflowed, nothing escaped its parent, no page
 * scrolled sideways. All true, and all beside the point — the traveller panel
 * shipped visibly broken anyway.
 *
 * It passed because containment is not correctness. The panel sat inside its
 * form field and was narrower than it, so every containment check was happy
 * while the thing was a permanently-open transparent block with its labels
 * wrapped onto three lines. And the panels that ARE hidden at rest were
 * skipped outright, because the audit filtered on visibility.
 *
 * So: open each interactive state and take a picture of it. A person looking
 * at the output catches in a second what a containment check cannot express.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const OUT = process.env.SHOT_DIR || path.join(__dirname, '..', '.shots');

/** Each state: what to open, and what to frame. */
const STATES = [
  { name: 'home',            path: '/' },
  { name: 'travellers',      path: '/', open: "$('.traveller_focus').first().trigger('click')", clip: '#pop' },
  { name: 'calendar',        path: '/', open: "$('#depfield').trigger('click')",                clip: '.desktop_view_calaender' },
  { name: 'origin-search',   path: '/', open: "$('#origin2').trigger('click').val('lon').trigger('keyup')", clip: '.listsearchlist' },
  { name: 'search-card',     path: '/', clip: '.sercheform' },
  { name: 'footer',          path: '/', clip: 'footer' },
  { name: 'results',         path: '/airline/searchflight' },
  { name: 'fees-table',      path: '/charges-fees' },
  { name: 'faq',             path: '/faq' },
];

const VIEWPORTS = [
  { tag: 'desktop', width: 1440, height: 900 },
  { tag: 'mobile',  width: 390,  height: 844, mobile: true },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const written = [];
  const problems = [];

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({
      width: vp.width, height: vp.height,
      deviceScaleFactor: 2, isMobile: !!vp.mobile, hasTouch: !!vp.mobile,
    });

    for (const st of STATES) {
      const file = path.join(OUT, `${st.name}-${vp.tag}.png`);
      try {
        await page.goto(BASE + st.path, { waitUntil: 'networkidle2', timeout: 45000 });

        // Dismiss the on-load popup; it covers everything else.
        await page.evaluate(() => {
          const x = document.getElementById('closebvtn');
          if (x) x.click();
          const ov = document.querySelector('.overllllay');
          if (ov) ov.style.display = 'none';
        });

        // Reveal-on-scroll hides anything below the fold until it scrolls
        // into view. A full-page capture renders those elements anyway, so
        // without this they photograph blank. motion.js shows everything
        // after 2.5s regardless; this just does it immediately.
        await page.evaluate(() => {
          document.querySelectorAll('.will-reveal').forEach((el) => {
            el.classList.add('is-revealed');
            el.style.transition = 'none';     // the fade is 420ms; do not photograph it halfway
          });
        });
        await new Promise((r) => setTimeout(r, 250));

        if (st.open) {
          await page.evaluate(st.open);
          await new Promise((r) => setTimeout(r, 900));   // let jQuery finish animating
        }

        let target = null;
        if (st.clip) {
          target = await page.$(st.clip);
          if (!target) problems.push(`${st.name}/${vp.tag}: ${st.clip} not found`);
        }

        if (target) {
          const box = await target.boundingBox();
          if (!box || box.width < 2 || box.height < 2) {
            problems.push(`${st.name}/${vp.tag}: ${st.clip} has no size — did it open?`);
            await page.screenshot({ path: file });
          } else {
            // A little air around the element so its edges are visible.
            const pad = 16;
            await page.screenshot({ path: file, clip: {
              x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad),
              width: Math.min(vp.width, box.width + pad * 2),
              height: Math.min(4000, box.height + pad * 2),
            }});
          }
        } else {
          await page.screenshot({ path: file, fullPage: !st.clip });
        }
        written.push(path.relative(process.cwd(), file));
      } catch (err) {
        problems.push(`${st.name}/${vp.tag}: ${err.message.split('\n')[0]}`);
      }
    }
    await page.close();
  }

  await browser.close();

  console.log(`\nЗнімків: ${written.length}  ->  ${path.relative(process.cwd(), OUT)}/`);
  for (const f of written) console.log('  ' + f);
  if (problems.length) {
    console.log(`\nНе вдалось (${problems.length}):`);
    for (const p of problems) console.log('  ! ' + p);
    process.exitCode = 1;
  }
})();
