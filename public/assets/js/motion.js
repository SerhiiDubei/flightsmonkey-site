/*
 * Reveal-on-scroll, replacing assets/js/scrolls.min.js.
 *
 * The library this supersedes had three faults, all of which cost content:
 *
 *   1. its constructor set style.opacity = 0 the moment it ran, so every
 *      element it touched was hidden before anything had been scrolled;
 *   2. it hid elements again on exit, so scrolling past a heading blanked it;
 *   3. hideScrollBarX() animated overflowX:hidden onto the parent AND the
 *      grandparent with fill:forwards, permanently clipping ancestors that
 *      were never meant to clip. That is what cut the first letter off the
 *      feature copy and squeezed the "Browse more destinations" card.
 *
 * The rules here are the opposite:
 *   - text is painted by default; hiding only ever happens in JS, so a failure
 *     anywhere leaves the page readable rather than blank;
 *   - the reveal is one-shot — once shown, an element can never hide again;
 *   - nothing outside the animated element is touched;
 *   - prefers-reduced-motion opts out entirely;
 *   - anything above the fold at load is marked shown without animating, so
 *     there is no flash of content disappearing and coming back.
 */
(function () {
  'use strict';

  var els = document.querySelectorAll('[scrolls]');
  if (!els.length) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || typeof IntersectionObserver !== 'function') return;   // leave everything visible

  var show = function (el) { el.classList.add('is-revealed'); };
  var io = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      show(entries[i].target);
      io.unobserve(entries[i].target);
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });

  var fold = window.innerHeight * 0.95;
  var pending = [];

  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    el.classList.add('will-reveal');
    if (el.getBoundingClientRect().top < fold) {
      show(el);                 // already on screen: no animation, no flash
    } else {
      pending.push(el);
      io.observe(el);
    }
  }

  // Last resort: if the observer never fires (print, odd viewport, a stacking
  // context that keeps the element out of the root), show everything anyway.
  setTimeout(function () {
    for (var j = 0; j < pending.length; j++) show(pending[j]);
  }, 2500);
}());

/*
 * Close the date picker once the dates are chosen.
 *
 * The picker opens over the search card and its panel reaches past the
 * Search flights button, so leaving it open after a pick hides the very
 * control the user is heading for. Clicking outside already closed it —
 * search.js has a document mouseup for that — but picking a date is a click
 * INSIDE the panel, and nothing closed it.
 *
 * Listening for that click does not work, and the reason is worth writing
 * down: jQuery UI redraws the whole calendar synchronously inside its own
 * click handler, so the anchor that was clicked is detached from the
 * document before the event finishes propagating. It never reaches
 * document, and it never reaches the panel either. jQuery UI also writes
 * the date with .val(), which fires no change event. So there is no event
 * to hang this on at all.
 *
 * What does reliably happen is the redraw itself. Watching the panel for
 * mutations catches every pick, and comparing the field values against the
 * previous pass tells a real pick apart from an ordinary repaint — opening
 * the picker again on an already-filled field must not slam it shut.
 *
 * When to close depends on the trip type:
 *   - One Way has one date, so the pick that fills it is the last one;
 *   - Round Trip needs both, so it stays open until the return is set too.
 */
(function () {
  'use strict';

  var panels = document.querySelectorAll('.desktop_view_calaender');
  if (!panels.length || typeof MutationObserver !== 'function') return;

  var val = function (id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  };

  var lastDep = val('depfield');
  var lastArr = val('arrfield');

  var check = function () {
    var dep = val('depfield');
    var arr = val('arrfield');
    var changed = dep !== lastDep || arr !== lastArr;
    lastDep = dep;
    lastArr = arr;
    if (!changed) return;                 // a repaint, not a pick

    var oneway = document.getElementById('oneway');
    var done = (oneway && oneway.checked) ? !!dep : (!!dep && !!arr);
    if (!done) return;                    // round trip, still choosing the return

    for (var i = 0; i < panels.length; i++) panels[i].style.display = 'none';
  };

  for (var i = 0; i < panels.length; i++) {
    new MutationObserver(check).observe(panels[i], { childList: true, subtree: true });
  }
}());
