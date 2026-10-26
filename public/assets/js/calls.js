/* Calls from the site (ТЗ 23.10.2026).
 * - remembers the ad parameters (UTM, gclid) a visitor arrived with, 90 days;
 * - sends a phone_click event for every tel: link, with the element it came from
 *   (sticky / banner / popup / header / footer / page) and those parameters;
 * - the call pop-up on the flight results page: once per session, closes with × or Esc;
 * - "Copy" for the number on desktop;
 * - FMCalls.setPhone(): one place to swap the number if a call-tracking service is added.
 * Events go to gtag() when GA4 is loaded, otherwise to window.dataLayer for GTM. */
(function () {
  'use strict';

  var conf = {};
  try { conf = JSON.parse(document.getElementById('fm-calls-config').textContent); } catch (e) {}

  var PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid'];
  var ATTR_KEY = 'fm_attr', DAYS = 90;

  function storage(kind) { try { return window[kind]; } catch (e) { return null; } }
  function readAttr() {
    var s = storage('localStorage');
    if (!s) return {};
    try {
      var a = JSON.parse(s.getItem(ATTR_KEY) || '{}');
      return a.exp && a.exp < Date.now() ? {} : a;
    } catch (e) { return {}; }
  }
  function captureAttr() {
    var q = new URLSearchParams(location.search), touch = {}, found = false;
    PARAMS.forEach(function (p) { var v = q.get(p); if (v) { touch[p] = v.slice(0, 200); found = true; } });
    var a = readAttr();
    if (!found) return a;
    touch.landing = location.pathname;
    touch.ts = new Date().toISOString();
    if (!a.first) a.first = touch;
    a.last = touch;
    a.exp = Date.now() + DAYS * 864e5;
    var s = storage('localStorage');
    if (s) { try { s.setItem(ATTR_KEY, JSON.stringify(a)); } catch (e) {} }
    if (touch.gclid) document.cookie = 'fm_gclid=' + encodeURIComponent(touch.gclid) + ';path=/;max-age=' + DAYS * 86400 + ';SameSite=Lax';
    return a;
  }
  var attr = captureAttr();

  function track(name, params) {
    var data = { page_path: location.pathname };
    var last = attr.last || {};
    PARAMS.forEach(function (p) { if (last[p]) data[p] = last[p]; });
    for (var k in params) data[k] = params[k];
    if (typeof window.gtag === 'function') { window.gtag('event', name, data); return; }
    window.dataLayer = window.dataLayer || [];
    var push = { event: name };
    for (var j in data) push[j] = data[j];
    window.dataLayer.push(push);
  }

  function sourceOf(el) {
    var tagged = el.closest('[data-call-source]');
    if (tagged) return tagged.getAttribute('data-call-source');
    if (el.closest('header, nav, #headnav')) return 'header';
    if (el.closest('footer')) return 'footer';
    return 'page';
  }

  // Every call click on the site, in the capture phase so nothing else can swallow it
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href^="tel:"]');
    if (!a) return;
    track('phone_click', { call_source: sourceOf(a), phone_number: a.getAttribute('href').slice(4) });
    if (conf.adsCallConversion && typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', { send_to: conf.adsCallConversion });
    }
  }, true);

  // Desktop: copy the number to dial it from a phone
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest && e.target.closest('[data-copy-phone]');
    if (!btn) return;
    var text = conf.phoneDisplay || conf.phone || '';
    var done = function () {
      var was = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = was; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
    else done();
    track('phone_copy', { call_source: sourceOf(btn) });
  });

  // ---- Call pop-up ------------------------------------------------------
  var popup = conf.popup || {};
  var SEEN = 'fm_call_popup';
  var onResults = !!document.querySelector('.listcontainer');

  function popupSeen() { var s = storage('sessionStorage'); try { return !!s && s.getItem(SEEN) === '1'; } catch (e) { return false; } }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }

  function closePopup(box, how) {
    if (!box.parentNode) return;
    box.parentNode.removeChild(box);
    track('phone_popup_closed', { how: how });
  }

  function showPopup(reason) {
    if (!popup.enabled || popupSeen() || document.querySelector('.fm-popup')) return false;
    var s = storage('sessionStorage');
    if (s) { try { s.setItem(SEEN, '1'); } catch (e) {} }

    var box = el('div', 'fm-popup');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'false');
    box.setAttribute('aria-labelledby', 'fm-popup-title');
    box.setAttribute('data-call-source', 'popup');
    var x = el('button', 'fm-popup-x', '×');
    x.type = 'button';
    x.setAttribute('aria-label', 'Close');
    var title = el('strong', '', popup.title || 'Call now');
    title.id = 'fm-popup-title';
    var call = el('a', 'fm-popup-call');
    call.href = 'tel:' + (conf.phone || '');
    call.setAttribute('data-call-number', '');
    call.appendChild(el('i', 'fa-solid fa-phone'));
    call.appendChild(document.createTextNode(' ' + (popup.button || 'Call') + ' '));
    var num = el('span', '', conf.phoneDisplay || conf.phone || '');
    num.setAttribute('data-call-display', '');
    call.appendChild(num);
    box.appendChild(x);
    box.appendChild(title);
    if (popup.text) box.appendChild(el('p', '', popup.text));
    box.appendChild(call);
    document.body.appendChild(box);

    x.addEventListener('click', function () { closePopup(box, 'close_button'); });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { closePopup(box, 'escape'); document.removeEventListener('keydown', onKey); }
    });
    track('phone_popup_shown', { reason: reason });
    return true;
  }

  if (onResults && popup.enabled) {
    // While the flight list is still loading — the moment competitors use
    if (popup.showWhileResultsLoad) {
      setTimeout(function () {
        var loader = document.querySelector('.shimmerround');
        if (loader && loader.offsetParent !== null) showPopup('results_loading');
      }, 1500);
    }
    if (Number(popup.showAfterSeconds) > 0) {
      setTimeout(function () { showPopup('timer'); }, Number(popup.showAfterSeconds) * 1000);
    }
    // Desktop only: the pointer leaves through the top of the window
    if (popup.exitIntent && window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
      document.addEventListener('mouseout', function (e) {
        if (!e.relatedTarget && e.clientY <= 0) showPopup('exit_intent');
      });
    }
  }

  // ---- One place to change the number (for a call-tracking service) ------
  function setPhone(e164, display) {
    var old = conf.phone;
    conf.phone = e164;
    conf.phoneDisplay = display || e164;
    document.querySelectorAll('[data-call-number]').forEach(function (n) { n.setAttribute('href', 'tel:' + e164); });
    if (old) document.querySelectorAll('a[href="tel:' + old + '"]').forEach(function (n) { n.setAttribute('href', 'tel:' + e164); });
    document.querySelectorAll('[data-call-display]').forEach(function (n) { n.textContent = conf.phoneDisplay; });
  }

  window.FMCalls = { setPhone: setPhone, showPopup: showPopup, track: track, attribution: function () { return readAttr(); } };
})();

