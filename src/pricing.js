'use strict';
// =====================================================================================
//  PRICING POLICY — the one place where a supplier fare becomes the customer price.
//
//  The original site adds a flat "Convenience Fee" of 10 on top of the supplier total
//  and supports coupon codes. This module reproduces that, but it is deliberately the
//  spot you will want to shape yourself: flat fee vs. percentage markup vs. per-passenger
//  fee, rounding rules, coupon rules, minimum margins, etc.
// =====================================================================================
const { round2 } = require('./util');

// Coupon table (code -> rule). Mirrors the original applucoupon response fields.
//   coupontype: 'amt' (fixed amount) | 'per' (percentage)
const COUPONS = {
  XTREME10: { couponname: 'XTREME10', coupontype: 'amt', couponpercent: 10, minFare: 200 },
  SAVE5: { couponname: 'SAVE5', coupontype: 'per', couponpercent: 5, minFare: 0 },
};

/**
 * Turn a supplier price into what the customer sees and pays.
 * @param {object} price    normalized supplier price {total, base, taxes, perAdult, perChild, perInfant}
 * @param {object} query    the search query {adults, children, infants, tripType, cabin}
 * @returns {{supplierTotal:number, convenienceFee:number, markup:number, grandTotal:number}}
 */
function applyPricing(price, query) {
  // TODO (business rule): replace the two constants below with your own policy.
  //   - a percentage of the fare:            markup = round2(price.total * 0.03)
  //   - a fee per passenger:                 fee = 10 * (query.adults + query.children)
  //   - a different fee for business class:  query.cabin === 'BUSINESS' ? 25 : 10
  const CONVENIENCE_FEE = 10;   // flat fee shown as "Convenience Fee" (same as the original site)
  const MARKUP_PERCENT = 0;     // hidden percentage markup folded into the fare (0 = none)

  const markup = round2(price.total * (MARKUP_PERCENT / 100));
  const supplierTotal = round2(price.total + markup);
  const convenienceFee = round2(CONVENIENCE_FEE);
  return { supplierTotal, convenienceFee, markup, grandTotal: round2(supplierTotal + convenienceFee) };
}

/** Coupon lookup used by POST /applucoupon. Returns null for an unknown code. */
function findCoupon(code) {
  const c = COUPONS[String(code || '').trim().toUpperCase()];
  return c ? { ...c } : null;
}

function couponDiscount(coupon, fare) {
  if (!coupon || fare < (coupon.minFare || 0)) return 0;
  return coupon.coupontype === 'per' ? round2(fare * coupon.couponpercent / 100) : round2(coupon.couponpercent);
}

module.exports = { applyPricing, findCoupon, couponDiscount, COUPONS };
