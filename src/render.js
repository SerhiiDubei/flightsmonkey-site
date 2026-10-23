'use strict';
// HTML fragments that the original site rendered server-side (CodeIgniter views):
//   - flight result cards (round trip / one way), the filter sidebar and the sort bar
//   - the dynamic regions of the booking page and the thank-you page
// Markup and class names follow the fragments captured from the live site so the mirrored
// CSS (public/assets/css) and JS (public/ajax/search.js + inline results script) keep working.
const data = require('./data');
const { esc, fmtTime, fmtDateLong, fmtDateDMY, fmtDur, money, stopsLabel, toMinutes } = require('./util');

const ICON = {
  flight: '/assets/images/listing/flight-icon.png',
  map: '/assets/images/listing/map-icon.png',
  dep: '/assets/image/departure-plane-icon.png',
  ret: '/assets/image/return-plane-icon.png',
  arrow: '/assets/image/large-arrow.png',
  seat: '/assets/image/seat-icon.svg',
  minus: '/assets/image/ico/minus-icon.png',
  plus: '/assets/image/ico/plus-icon.png',
  calendar: '/assets/image/calender-icon.png',
};

// airline logos: mirrored copies first, public logo CDN as a fallback for carriers we did not mirror
function logoImg(code, extra = '') {
  const c = esc(String(code || '').toUpperCase());
  return `<img src="${data.logo(c)}" onerror="this.onerror=null;this.src='https://pics.avs.io/200/80/${c}.png'" alt="${c}"${extra}>`;
}

function legInfo(leg) {
  const f = leg.segments[0], l = leg.segments[leg.segments.length - 1];
  return {
    carrier: f.carrier, carrierName: f.carrierName,
    from: data.airport(f.from.code), to: data.airport(l.to.code),
    dep: f.departAt, arr: l.arriveAt, dur: leg.duration, stops: leg.stops,
  };
}

const bagsLabel = (b) => (/^\d+$/.test(String(b)) ? `${b} Pieces` : (b ? String(b) : '0 Pieces'));
const seatsLabel = (n) => (n > 0 ? `${n} Seats Left` : 'Seats Left');

/* ------------------------------------------------------------------ result cards */

function mobileRow(leg, cur, price) {
  return `
      <div class="row">
        <div class="col-sm-9"><div class="logo-res">${logoImg(leg.carrier)} ${esc(leg.carrierName)}</div></div>
        <div class="col-sm-3">${price ? `<h2 id="res-price">${cur} ${price}</h2>` : ''}</div>
      </div>
      <div class="row">
        <div class="col-sm-2"><div class="or"><p class="dtime">${fmtTime(leg.dep)}<br/>${esc(leg.from.code)}</p><p class="depcode">(${esc(leg.from.city)}) </p></div></div>
        <div class="col-sm-8">
          <p id="durationtime">${fmtDur(leg.dur)}</p>
          <div class="route"><div class="line"><img id="flighticon" src="${ICON.flight}"/><img id="locationicon" src="${ICON.map}"/></div></div>
          <p class="stop">${stopsLabel(leg.stops)}</p>
        </div>
        <div class="col-sm-2"><div class="or"><p class="dtime">${fmtTime(leg.arr)}<br/>${esc(leg.to.code)}</p><p class="depcode">(${esc(leg.to.city)}) </p></div></div>
      </div>`;
}

function flidDetails(cid, cur, price) {
  return `
      <div class="fliddetails">
        <h6><button aria-controls="${cid}" aria-expanded="false" data-target="#${cid}" data-toggle="collapse" id="fddd" type="button">FLIGHT DETAILS <i class="fas fa-angle-down"></i></button></h6>
        <div class="border-top bg-light px-3 py-3">
          <div class="d-flex align-items-center justify-content-between gap-3">
            <div class="min-w-0">
              <div class="d-flex align-items-baseline flex-wrap gap-1 price-wrapper"><span class="fw-semibold">${cur}</span><span class="fs-4 ml-1 fw-bold">${price}</span></div>
              <small class="text-black">Incl. taxes &amp; fees</small>
            </div>
            <button class="btn btn-primary flex-shrink-0 fw-bold text-uppercase rounded-2 px-3 px-md-4 py-2 text-nowrap" style="background-color: #1c7a68 !important; border-color: #1c7a68 !important;" type="submit">Book Now</button>
          </div>
        </div>
      </div>`;
}

function navRow(leg) {
  return `
        <div class="row">
          <div class="col-sm-3"><div class="logo">${logoImg(leg.carrier)}<h4>${esc(leg.carrierName)}</h4><div class="depdate"><p>Departure on ${fmtDateLong(leg.dep)}</p></div></div></div>
          <div class="col-sm-3"><div class="or"><p class="dtime">${fmtTime(leg.dep)}</p><p class="depcode"><span id="iatacodeS">${esc(leg.from.code)}</span> (${esc(leg.from.city)})</p></div></div>
          <div class="col-sm-3">
            <p id="durationtime">${fmtDur(leg.dur)}</p>
            <div class="route"><div class="line"><img id="flighticon" src="${ICON.flight}"/><img id="locationicon" src="${ICON.map}"/></div></div>
            <p class="stop">${stopsLabel(leg.stops)}</p>
          </div>
          <div class="col-sm-3"><div class="or"><p class="dtime">${fmtTime(leg.arr)}</p><p class="depcode"><span id="iatacodeS">${esc(leg.to.code)}</span> (${esc(leg.to.city)})</p></div></div>
        </div>`;
}

function segmentBlock(s, i, label, layover) {
  const from = data.airport(s.from.code), to = data.airport(s.to.code);
  const icon = label === 'Return' ? ICON.ret : ICON.dep;
  const flight = `Flight ${esc(s.carrier)} ${esc(s.flightNumber)} | Aircraft ${esc(s.aircraft || '-')}`;
  return `
    ${layover ? `<div class="divider-box"><p> <b>Layover</b>  -  <span>${fmtDur(layover)} at ${esc(from.city)}</span></p></div>` : ''}
    <div class="container">
      <div class="row flight-time-mobile">
        <div class="depar-box">${i === 0 ? `<div class="depart-btn"><p><span><img src="${icon}"/></span> ${label}</p></div>` : ''}</div>
        <div class="col-sm-3">
          <div class="logo">
            <div class="f-deta">${logoImg(s.carrier)}<h4>${esc(s.carrierName)}</h4><h5>${flight}</h5><h5 class="spac">${esc(from.name)}</h5></div>
            <div class="flgh-desp">
              <div class="depdate"><p><span><i aria-hidden="true" class="fa fa-clock-o"></i></span> Duration: ${fmtDur(s.duration)}</p></div>
              <div class="col-sm-2 baggagebox baggage-mobile"><p><span><i aria-hidden="true" class="fa fa-suitcase"></i></span> Checked Baggage ${esc(bagsLabel(s.bags))}</p></div>
            </div>
          </div>
        </div>
        <div class="col-sm-7 timebox desk">
          <div class="col-04"><p class="date-txtfnt">${fmtDateLong(s.departAt)}</p><p>${fmtTime(s.departAt)} <span>${esc(from.city)} (${esc(from.code)})${s.from.terminal ? ` T${esc(s.from.terminal)}` : ''}</span></p></div>
          <div class="col-04"><img src="${ICON.arrow}"/></div>
          <div class="col-04"><p class="date-txtfnt">${fmtDateLong(s.arriveAt)}</p><p>${fmtTime(s.arriveAt)} <span>${esc(to.city)} (${esc(to.code)})${s.to.terminal ? ` T${esc(s.to.terminal)}` : ''}</span></p></div>
        </div>
        <div class="col-sm-7 timebox mobile-des">
          <div class="col-01"><p class="timetxt"><span> (${esc(from.code)})</span> ${fmtTime(s.departAt)}</p><p>${fmtDateLong(s.departAt)}</p></div>
          <div class="col-03"><img src="${ICON.arrow}"/></div>
          <div class="col-04"><p class="timetxt"><span> (${esc(to.code)})</span> ${fmtTime(s.arriveAt)}</p><p>${fmtDateLong(s.arriveAt)}</p></div>
        </div>
        <div class="col-sm-2 baggagebox baggage-desk"><p><span><i aria-hidden="true" class="fa fa-suitcase"></i></span> Checked Baggage ${esc(bagsLabel(s.bags))}</p></div>
      </div>
      <div class="row flight-time-desk"><div class="depar-box"><div class="depart-btn"><p><span><img src="${icon}"/></span> ${label} <b>(${esc(from.code)} to ${esc(to.code)})</b></p></div></div></div>
    </div>`;
}

function legDetails(leg, label) {
  let html = '';
  leg.segments.forEach((s, i) => {
    const layover = i > 0 ? Math.max(0, toMinutes(s.departAt) - toMinutes(leg.segments[i - 1].arriveAt)) : 0;
    html += segmentBlock(s, i, label, layover);
  });
  return `<div class="container"><div class="row col-sp"><div class="roundtrip-box">${html}</div></div></div>`;
}

function detailsBox(offer, cid, extraClass = '') {
  const legs = offer.itineraries;
  return `
  <div class="collapse ${extraClass}" id="${cid}">
    <div class="card card-body thespbody full-wdt">
      ${legDetails(legs[0], 'Departure')}
      ${legs[1] ? `<div class="difborder"></div>${legDetails(legs[1], 'Return')}` : ''}
    </div>
  </div>`;
}

function pricebar(cur, price, oneway) {
  return `<div class="pricebar${oneway ? ' onew' : ''}"><div class="hrborder"></div><h2>${cur} ${price}</h2><p>Incl. taxes &amp; fees</p><div class="btn-box"><div class="triangle_btn noch"></div><button class="btn btn-booknow" type="submit">BOOK NOW </button></div></div>`;
}

function hiddenInputs(offer, ctx, pricing) {
  const legs = offer.itineraries;
  const h = (n, v) => `<input type="hidden" name="${n}" value="${esc(v)}"/>`;
  return [
    h('offer_id', offer.id), h('tsegid', offer.id),
    h('madult', ctx.adults), h('mchildren', ctx.children), h('minfant', ctx.infants),
    h('pricePerAdult', money(offer.price.perAdult)), h('pricePerChild', money(offer.price.perChild)),
    h('pricePerInfant', money(offer.price.perInfant)), h('price', money(pricing.supplierTotal)),
    h('basefare', money(offer.price.base)), h('taxandfee', money(offer.price.taxes)),
    h('m_duration_d', fmtDur(legs[0].duration)), h('m_duration_r', legs[1] ? fmtDur(legs[1].duration) : ''),
  ].join('');
}

/** One result card. ctx = { tripType, adults, children, infants, pricing(offer) } */
function card(offer, idx, ctx) {
  const round = ctx.tripType === 'round' && offer.itineraries.length > 1;
  const out = legInfo(offer.itineraries[0]);
  const back = round ? legInfo(offer.itineraries[1]) : null;
  const pricing = ctx.pricing(offer);
  const cur = esc(offer.currency);
  const price = money(pricing.supplierTotal);
  const cid = `collapseExample-${idx}`;
  const seats = seatsLabel(offer.seats);

  let body;
  if (round) {
    body = `
  <div class="data-show-res">
    <div class="depar-res">${mobileRow(out, cur, price)}</div>
    <div class="return">${mobileRow(back, cur, '')}${flidDetails(cid, cur, price)}</div>
  </div>
  <div class="data-show">
    <div class="row">
      <div class="col-sm-9">
        <div class="result-nav">${navRow(out)}</div>
        <div class="first"></div>
        <div class="result-nav second">${navRow(back)}</div>
      </div>
      <div class="col-sm-3">${pricebar(cur, price, false)}</div>
      <div class="col-sm-12 third"></div>
    </div>
    <div class="row achortag">
      <div class="col-sm-9"><h6><a aria-controls="${cid}" aria-expanded="false" data-target="#${cid}" data-toggle="collapse" href="#${cid}" id="col_listingbtn">FLIGHT DETAILS <i class="fas fa-angle-down"></i></a></h6></div>
      <div class="col-sm-3"><div class="classtype classtype-roundtrip"><img alt="seat" src="${ICON.seat}"/><span id="seatred"> ${seats} </span></div></div>
    </div>
    <div class="col-sm-12 third"></div>
  </div>`;
  } else {
    body = `
  <div class="data-show-res oner-res-div">
    <div class="depar-res">${mobileRow(out, cur, price)}${flidDetails(cid, cur, price)}</div>
  </div>
  <div class="result-nav res-oneway">
    <div class="row">
      <div class="col-sm-9">${navRow(out)}</div>
      <div class="col-sm-3"><div class="row"><div class="col-sm-12">${pricebar(cur, price, true)}</div></div></div>
      <div class="col-sm-12">
        <div class="brflight"></div>
        <div class="contlibr">
          <div class="row">
            <div class="col-sm-9"><a aria-controls="${cid}" aria-expanded="false" data-target="#${cid}" data-toggle="collapse" href="#${cid}" id="flightd-res">FLIGHT DETAILS <i class="fas fa-angle-down"></i></a></div>
            <div class="col-sm-3"><div class="classtype classtype-roundtrip"><img alt="seat" src="${ICON.seat}"/><span id="seatred"> ${seats} </span></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  }
  const action = round ? '/airline/returnbooking' : '/airline/booking';
  const cls = round ? 'all round_trip' : `all oneway oneway_${esc(out.carrier).toLowerCase()} price_${price}`;
  return `<form action="${action}" class="${cls}" method="POST">${hiddenInputs(offer, ctx, pricing)}${body}${detailsBox(offer, cid)}</form>`;
}

/** A page of cards wrapped exactly like the original: <div class="list_<offset>">…</div> */
function list(offers, offset, ctx, initial) {
  if (!offers.length && initial) {
    return `<div class="list_0"><div class="no-search"><h3>No Flights ! Restart Search.</h3><p>${esc(ctx.message || 'No flights were found for this search. Please modify your search and try again.')}</p></div></div>`;
  }
  return `<div class="list_${offset}">${offers.map((o, i) => card(o, offset + i, ctx)).join('\n')}</div>`;
}

/* ------------------------------------------------------------------ sidebar + sort bar */

function filterSidebar(st, ctx, shown) {
  const stops = st.stops.map((n) => `
      <div class="go-right">
        <input class="custom-control-input radio_check mystopsradio" type="radio" onclick="getstops(${n})" name="priceOrder" id="${n}" value="${n}">
        <label class="custom-control-label go-left"><div class="checkbox_stops"> ${stopsLabel(n)} </div></label>
      </div>`).join('');
  const airlines = st.airlines.map((a, i) => `
        <div class="checkbox_stops">
          <div class="form-check checkbox-lg" id="myBtn">
            <input class="form-check-input uncheck_1" type="checkbox" data-val="${esc(a.name.replace(/\s+/g, ''))}" value="${esc(a.code)}" name="airlines" id="check_${i}">
            <label class="form-check-label filter_air_img">${logoImg(a.code)} ${esc(a.name)} (${a.count})</label>
          </div>
        </div>`).join('');
  const slot = (cls, icon, txt) => `<button type="button" class="btn btn-light btncallval ${cls}" onclick="getTxt(this);"><i class="${icon}"></i><span>${txt}</span></button>`;
  return `
  <div class="headingbar">
    <input type="hidden" id="min_price" name="custId" value="${money(st.min)}">
    <input type="hidden" id="max_price" name="custId" value="${money(st.max)}">
    <h4>Filter Your Results <span class="uncheckreset_2"><i class="fa fa-refresh" aria-hidden="true"></i> Reset filter</span></h4>
    <p>Showing <span class="resultcountvar">${shown} </span> result out of <span id="mainresultcountvar">${st.count}</span></p>
  </div>
  <div class="main-filtersection">
    <div class="white-border-box">
      <div class="row"><div class="col-sm-12 hed-fullborder mrg-btm"><div class="hed"><h3>Stops</h3><div class="filterborder"></div></div></div></div>
      <div id="group_main" class="custom-control custom-radio group_main">${stops}</div>
    </div>
    <div class="white-border-box">
      <div class="row"><div class="col-sm-12 hed-fullborder"><div class="hed"><h3>Departure From ${esc(ctx.origin)}</h3><div class="filterborder"></div></div></div></div>
      <div id="depfrmval">${slot('a', 'fas fa-cloud-sun', '00-06')} ${slot('b', 'far fa-sun', '06-12')} ${slot('c', 'fas fa-cloud-moon', '12-18')} ${slot('d', 'fas fa-moon', '18-00')}</div>
    </div>
    <div class="white-border-box flightbrdivnew">
      <div class="row"><div class="col-sm-12 hed-fullborder"><div class="hed "><h3>Preferred Airlines</h3><div class="filterborder"></div></div></div></div>
      <div class="flight-scroll">${airlines}</div>
    </div>
    <div class="white-border-box">
      <div class="row"><div class="col-sm-12 hed-fullborder"><div class="hed"><h3>Price</h3><div class="filterborder"></div></div></div></div>
      <input type="text" class="js-range-slider" name="my_range" value="" />
    </div>
  </div>`;
}

function sortBar(st, cur) {
  if (!st.count) return '';
  const box = (cls, img, title, priceCls, price, valCls, val, border) => `
    <div class="col-sm-4">
      <div class="overviewprice ${cls}">
        <h4><span><img src="/assets/image/${img}" /></span> ${title}</h4>
        <h3 class="${priceCls}"> ${esc(cur)} ${money(price)} </h3>
        <input type="hidden" class="${valCls}" value="${val}">
      </div>
      <div class="${border}"></div>
    </div>`;
  return `
  <div class="overpricefilter"><div class="row">
    ${box('erestclickfare', 'travel.gif', 'Earliest', 'myrecomendedflightfare', st.earliest.price, 'earliest_value', `earliest-${st.earliest.epoch}`, 'callonclickfilterborder-erest')}
    ${box('ovpricechepestcont', 'money-bag.gif', 'Cheapest', 'ovpricechepest', st.cheapest.price, 'cheapest_value', `cheapest-${money(st.cheapest.price)}`, 'hero callonclickfilterborder')}
    ${box('findshortestflight', 'down-time.gif', 'Fastest', 'myshortestflightfare', st.fastest.price, 'shortest_value', `shortest-${st.fastest.minutes}`, 'callonclickfilterborder-er')}
  </div></div>`;
}

/* ------------------------------------------------------------------ booking page regions */

function bookingItinerary(offer, ctx, fare) {
  const round = offer.itineraries.length > 1;
  const out = legInfo(offer.itineraries[0]);
  const back = round ? legInfo(offer.itineraries[1]) : null;
  const cur = esc(offer.currency);
  const price = money(fare.supplierTotal);
  return `
  <div class="main_bookdetails">
    <div class="info countbarreturnmob">
      <div class="mar-top-booking"></div>
      <div class="countdown"></div>
      <p class="p_booking_main"> Session will expire after <span id="red_h">15 minutes</span> - pricing and availability may change.</p>
    </div>
    <h4><span><i class="fa-solid fa-plane"></i></span> Itinerary Details</h4>
    <div class="data-show-res${round ? '' : ' oner-res-div'} mobresfdrf">
      <div class="depar-res">${mobileRow(out, cur, price)}</div>
      ${back ? `<div class="return">${mobileRow(back, cur, '')}</div>` : ''}
    </div>
    <div class="data-show">
      <div class="row">
        <div class="col-sm-9">
          <div class="result-nav">${navRow(out)}</div>
          ${back ? `<div class="first"></div><div class="result-nav second">${navRow(back)}</div>` : ''}
        </div>
        <div class="col-sm-3"><div class="pricebar"><div class="hrborder"></div><h2>${cur} ${price}</h2><p>Incl. taxes &amp; fees</p></div></div>
        <div class="col-sm-12 third"></div>
      </div>
      <div class="row achortag">
        <div class="col-sm-9"><h6><a aria-controls="collapseExample" aria-expanded="false" data-target="#collapseExample" data-toggle="collapse" href="#collapseExample" id="col_listingbtn">FLIGHT DETAILS <i class="fas fa-angle-down"></i></a></h6></div>
        <div class="col-sm-3"><div class="classtype classtype-roundtrip"><img alt="seat" src="${ICON.seat}"/><span id="seatred"> ${seatsLabel(offer.seats)} </span></div></div>
      </div>
      <div class="col-sm-12 third"></div>
    </div>
    ${detailsBox(offer, 'collapseExample', 'b_fdeails')}
  </div>`;
}

function bookingBaggage(offer, ctx) {
  const round = offer.itineraries.length > 1;
  const out = legInfo(offer.itineraries[0]);
  const bags = offer.itineraries[0].segments[0].bags;
  const checked = /^\d+$/.test(String(bags)) ? Number(bags) > 0 : !!bags;
  const yes = '<i class="fa-solid fa-check" style="color:green"></i>';
  const no = '<i class="fa-solid fa-xmark" style="color:#0a5245"></i>';
  return `
  <div class="main_bookdetails passengers">
    <div class="Payment_info pdetails">
      <div class="heading-whitebox">
        <div class="row align-items-center mb-2">
          <div class="col-sm-1"><i class="fa-solid fa-suitcase-rolling" style="font-size:37px;color:#a8ccbf;margin:0 0 0 21px;"></i></div>
          <div class="col-sm-11 baggage-hed">
            <h3> Baggage Information (per person)</h3>
            <h4>${round ? 'Round Trip' : 'One Way'} ${esc(out.from.code)} <i class="fa-solid fa-${round ? 'right-left' : 'arrow-right'}" style="font-size:10px;margin:0 4px 2px 4px;"></i> ${esc(out.to.code)}</h4>
          </div>
        </div>
        <div class="row" id="baggagebx">
          <div class="col-sm-4"><h5><img src="/assets/images/purse-svgrepo-com.svg" width="20px" /> Personal Item</h5><p>Purse, small backpack, briefcase</p><p>${yes} Included</p></div>
          <div class="col-sm-4"><h5><img src="/assets/images/carry-bag-2-svgrepo-com.svg" width="20px" /> Carry-on bag</h5><p>${yes} Included</p></div>
          <div class="col-sm-4"><h5><img src="/assets/images/185103_shopping_bag_icon.svg" width="20px" /> Checked bag</h5><p>${checked ? `${yes} Included (${esc(bagsLabel(bags))})` : `${no} Not Included`}</p></div>
        </div>
      </div>
    </div>
  </div>`;
}

function tripSidebox(offer) {
  const round = offer.itineraries.length > 1;
  const out = legInfo(offer.itineraries[0]);
  const back = round ? legInfo(offer.itineraries[1]) : null;
  return `
      <div class="trip-sidebox">
        <div class="trip-topbox"><h4><span><i aria-hidden="true" class="fa fa-${round ? 'exchange' : 'long-arrow-right'}"></i></span> ${round ? 'Round Trip' : 'One Way'}</h4></div>
        <div class="trip-bttmbox"><ul>
          <li> ${esc(out.from.city)} - <strong class="fgt-wgt colo-grn"> ${esc(out.to.city)} </strong> <span>${fmtDateDMY(out.dep)}</span></li>
          ${back ? `<li> ${esc(back.from.city)} - <strong class="fgt-wgt colo-grn"> ${esc(back.to.city)} </strong> <span>${fmtDateDMY(back.dep)}</span></li>` : ''}
        </ul></div>
      </div>`;
}

function fareTables(offer, ctx, fare, withInputs) {
  const cur = esc(offer.currency);
  const row = (label, value) => `<tr><td>${label}</td><td class="fareloc">${value}</td></tr>`;
  const pax = (label, count, per, cls) => (count > 0 ? `
      <table>
        ${row(`${label} `, count)}
        ${row(`Price / ${label}s`, `<div class="${cls}Price">${cur} ${money(per)}</div>${withInputs ? `<input id="price${cls[0].toUpperCase() + cls.slice(1)}" name="price${cls[0].toUpperCase() + cls.slice(1)}" type="hidden" value="${money(per)}"/>` : ''}`)}
        ${row(`Total Price for ${label}s`, `<div class="${cls}Total">${cur} ${money(per * count)}</div>`)}
      </table>` : '');
  const hidden = withInputs ? `
          <input id="conveniencefee" name="conveniencefee" type="hidden" value="${money(fare.convenienceFee)}"/>
          <input id="totalPrice" name="sellerPrice" type="hidden" value="${money(fare.grandTotal)}"/>
          <input class="final_total" name="totalPrice" type="hidden" value="${money(fare.grandTotal)}"/>
          <input name="discount" type="hidden" value="0"/>
          <input class="final_total" name="final_total" type="hidden" value="${money(fare.grandTotal)}"/>
          <input class="coupon_value" name="coupon_value" type="hidden" value=""/>
          <input class="discount_value" name="discount_value" type="hidden" value=""/>` : '';
  return `
      ${pax('Adult', ctx.adults, offer.price.perAdult, 'adult')}
      ${pax('Child', ctx.children, offer.price.perChild, 'child')}
      ${pax('Infant', ctx.infants, offer.price.perInfant, 'infant')}
      <hr/>
      <table>${row('Convenience Fee ', `${cur} <span id="confee">${money(fare.convenienceFee)}</span>`)}</table>
      <table>${row('Coupon ', `<span class="mycouponper" id="mycouponper">${cur} 0</span>`)}</table>
      <table>${row('Discount ', `<span class="mycoupondicount" id="mycoupondicount"><span id="tprice">${cur} 0</span></span>`)}</table>
      <hr/>
      <table><tr><td class="total-txt"><strong class="fgt-wgt">Grand Total:</strong></td><td class="fareloc"><div class="grandTotal">${cur} ${money(fare.grandTotal)}</div><span class="ctp" id="ctp"></span>${hidden}</td></tr></table>`;
}

function paxFields(type, idx, opts) {
  const name = (f) => `booking_data[${type}][${idx}][${f}]`;
  const titleSel = `<select autocomplete="off" class="form-control booking_frm" name="${name('title')}" required=""><option value="Mr">Mr.</option><option value="Mrs">Mrs.</option><option value="Miss">Miss.</option><option value="Ms">Ms.</option><option value="Dr">Dr.</option></select>`;
  const gender = `<select autocomplete="off" class="form-control booking_frm" name="${name('gender')}" required=""><option value="">Gender</option><option value="male">Male</option><option value="female">Female</option></select>`;
  const input = (f, ph, req) => `<input autocomplete="off" class="form-control booking_frm" name="${name(f)}" placeholder="${ph}" ${req ? 'required="required"' : ''} type="text" value=""/>`;
  const dob = (mobile) => `<input autocomplete="off" class="form-control booking_frm dob ${opts.dobClass}${mobile ? ' dpdob' : ''}" name="${name('dob')}" placeholder="Date Of Birth" readonly="readonly" required="required" type="text" value=""/>`;
  return { titleSel, gender, input, dob, isAdult: type === 'madult' };
}

function paxDesktop(ctx) {
  const groups = [
    { type: 'madult', label: 'Adult', count: ctx.adults, dobClass: 'dob-adult' },
    { type: 'mchildren', label: 'Child', count: ctx.children, dobClass: 'dob-child' },
    { type: 'minfant', label: 'Infant', count: ctx.infants, dobClass: 'dob-infant' },
  ];
  const blocks = groups.filter((g) => g.count > 0).map((g) => {
    const rows = [];
    for (let i = 0; i < g.count; i++) {
      const f = paxFields(g.type, i, g);
      rows.push(`
        <div class="row row-reverse">
          ${f.isAdult ? `<div class="col-md-2 mysp">${f.titleSel}</div>` : ''}
          <div class="col-md-${f.isAdult ? 2 : 3} mysp">${f.input('firstname', 'First Name', true)}</div>
          <div class="col-md-2 mysp">${f.input('midname', 'Middle Name', false)}</div>
          <div class="col-md-${f.isAdult ? 2 : 3} mysp">${f.input('lastname', 'Last Name', true)}</div>
          <div class="col-md-2 mysp"><i class="far fa-calendar-alt" id="icodate-neww"></i>${f.dob(false)}<div class="datepicker_text"></div></div>
          <div class="col-md-2 mysp">${f.gender}</div>
        </div>`);
    }
    return `<div class="adultbr"><span class="passangerheading"><div class="triangle-up"></div>${g.label} ${g.count} </span><br/><br/>${rows.join('')}</div>`;
  });
  return `
  <div class="passengerform deskres_pax">
    <h4><span><i class="fa-solid fa-circle-info"></i></span> Traveller Information</h4>
    <input name="numAdults" type="hidden" value="${ctx.adults}"/><input name="numChilds" type="hidden" value="${ctx.children}"/><input name="numInfants" type="hidden" value="${ctx.infants}"/>
    ${blocks.join('')}
    <div class="adultbr"><div class="notebord">
      <h6>Please Note:-</h6>
      <ul>
        <li><span><i aria-hidden="true" class="fa fa-caret-right"></i></span> Your passport should be valid for <span id="red_h">6 months</span> from the date of travel. (For international travel)</li>
        <li><span><i aria-hidden="true" class="fa fa-caret-right"></i></span> Passport details are mandatory for issuing tickets to international destinations, and in some cases Europe as well.</li>
        <li><span><i aria-hidden="true" class="fa fa-caret-right"></i></span> Some airlines require passport details to issue tickets. Sharing them now speeds up ticketing; otherwise we will call you back for them, as fares are subject to change.</li>
        <li><span><i aria-hidden="true" class="fa fa-caret-right"></i></span> Please ensure that the names of all passengers match their travel documents.</li>
      </ul>
    </div></div>
  </div>`;
}

function paxMobile(ctx) {
  const groups = [
    { type: 'madult', label: 'Adult', count: ctx.adults, dobClass: 'dob-adult' },
    { type: 'mchildren', label: 'Child', count: ctx.children, dobClass: 'dob-child' },
    { type: 'minfant', label: 'Infant', count: ctx.infants, dobClass: 'dob-infant' },
  ];
  const cards = [];
  let k = 0;
  for (const g of groups) {
    for (let i = 0; i < g.count; i++, k++) {
      const f = paxFields(g.type, i, g);
      cards.push(`
      <div class="card">
        <div class="card-header" id="heading_${k}"><h5 class=""><a aria-controls="collapse_${k}" aria-expanded="${k === 0}" class="btn btn-callbyclikck" data-target="#collapse_${k}" data-toggle="collapse"> ${i + 1}. ${g.label} <i class="fa-solid fa-angle-down theclickpax"></i></a></h5></div>
        <div aria-labelledby="heading_${k}" class="collapse${k === 0 ? ' show' : ''}" data-parent="#accordion" id="collapse_${k}">
          <div class="card-body">
            <div class="countadds"><div class="brtagvord"></div><div class="countadchinfant">${i + 1}</div></div>
            ${f.isAdult ? `<div class="row mobrowpax"><div class="col-sm-2">${f.titleSel.replace('class="form-control booking_frm"', 'class="form-control booking_frm" style="width:28%;"')}</div></div>` : ''}
            <div class="row mobrowpax"><div class="col-sm-4">${f.input('firstname', 'First Name', true)}</div><div class="col-sm-4">${f.input('midname', 'Middle Name', false)}</div><div class="col-sm-4">${f.input('lastname', 'Last Name', true)}</div></div>
            <div class="row mobrowpax"><div class="col-sm-6"><div class="icorel">${f.dob(true)}<img src="${ICON.calendar}"/><small class="mobiledateerror datepicker_text"></small></div></div><div class="col-sm-6">${f.gender}</div></div>
          </div>
        </div>
      </div>`);
    }
  }
  return `<div class="mobres_pax"><div id="accordion">${cards.join('')}</div></div>`;
}

function bookingFareMobileAndPax(offer, ctx, fare) {
  return `
  <div class="main_bookdetails passengers">
    <div class="Payment_info pdetails pderesdeskmobres">
      <div class="heading-whitebox"><h6><span><i class="fa-solid fa-ticket"></i></span> Fare Details</h6>${tripSidebox(offer)}</div>
      <div class="info">${fareTables(offer, ctx, fare, false)}</div>
    </div>
    <div class="passgermain">${paxDesktop(ctx)}${paxMobile(ctx)}</div>
  </div>`;
}

function bookingFareSidebar(offer, ctx, fare) {
  return `
  <div class="Payment_info pdetails pderesdesk">
    <div class="heading-whitebox"><h6><span><i class="fa-solid fa-ticket"></i></span> Fare Details</h6>${tripSidebox(offer)}</div>
    <div class="info">
      ${fareTables(offer, ctx, fare, true)}
      <div class="coponbox" style="margin-top:12px;">
        <div class="input-group">
          <input type="text" class="form-control txt_couponn" placeholder="Coupon code" autocomplete="off">
          <div class="input-group-append"><button class="btn btn-secondary btnapplycodee" type="button">Apply</button></div>
        </div>
        <div class="spbox" style="margin-top:6px;"></div>
      </div>
    </div>
  </div>`;
}

function bookingScript(ctx) {
  const year = Number(ctx.departDate.slice(0, 4)) || new Date().getFullYear();
  return `
<script>
(function () {
  // Desktop and mobile traveller forms share field names, so only the visible one may post.
  // The site's own CSS shows .mobres_pax and hides .deskres_pax at (max-width:600px) — mirror that.
  function syncPaxForms() {
    var mobile = window.matchMedia('(max-width: 600px)').matches;
    function toggle(sel, disabled) {
      var el = document.querySelector(sel); if (!el) return;
      el.querySelectorAll('input,select,textarea').forEach(function (i) { i.disabled = disabled; });
    }
    toggle('.deskres_pax', mobile);   // hidden on mobile
    toggle('.mobres_pax', !mobile);   // hidden on desktop
  }
  var dep = new Date('${esc(ctx.departDate)}T00:00:00');
  function ageOn(d) { var a = dep.getFullYear() - d.getFullYear(); var m = dep.getMonth() - d.getMonth(); if (m < 0 || (m === 0 && dep.getDate() < d.getDate())) a--; return a; }
  function setup(sel, min, max, label) {
    $(sel).each(function () {
      var inp = this;
      $(inp).datepicker({ changeMonth: true, changeYear: true, yearRange: '1920:${year}', dateFormat: 'mm/dd/yy',
        onSelect: function () {
          var a = ageOn($(inp).datepicker('getDate'));
          var err = $(inp).parent().find('.datepicker_text');
          if (a < min || a > max) { $(inp).css('border', '1px solid red').val(''); err.css('color', 'red').text('Invalid date, passenger is not ' + label + ' on the departure date.'); }
          else { $(inp).css('border', '1px solid #ced4da'); err.text(''); }
        } });
    });
  }
  $(function () {
    syncPaxForms(); $(window).on('resize', syncPaxForms);
    setup('.dob-adult', 12, 130, 'an adult (12+)'); setup('.dob-child', 2, 11, 'a child (2-11)'); setup('.dob-infant', 0, 1, 'an infant (under 2)');
    var end = Date.now() + 15 * 60 * 1000;
    var t = setInterval(tick, 1000); tick();
    function tick() {
      var left = Math.max(0, end - Date.now()); var m = Math.floor(left / 60000), s = Math.floor(left % 60000 / 1000);
      $('.countdown').text(('0' + m).slice(-2) + ':' + ('0' + s).slice(-2));
      if (left <= 0) { clearInterval(t); $('#popupSession').show(); }
    }
    $('#paymentFrm').on('submit', function () {
      if (!$('#tnc').is(':checked')) { $('.tandcerror').text('Please accept the Terms & Conditions.'); return false; }
      syncPaxForms();
      $('#callbtn').prop('disabled', true).find('.spinner-border').show();
    });
    $('#linktoclose').on('click', function () { $('#popupSession').hide(); });
  });
})();
</script>`;
}

function thankYou(b) {
  const offer = b.offer;
  const out = legInfo(offer.itineraries[0]);
  const cur = esc(offer.currency);
  const paxRows = b.passengers.map((p) => `<li><i class="fa-solid fa-user"></i> ${esc([p.title, p.firstname, p.midname, p.lastname].filter(Boolean).join(' '))} <small>(${esc(p.type)}${p.dob ? ', DOB ' + esc(p.dob) : ''})</small></li>`).join('');
  return `
  <div class="tophighlighttext"><div class="container">
    <div class="breadcrum"><h6><a href="/">Home</a> &gt; <a href="/airline/searchflight">Search</a> &gt; <span id="breadcrumonpage">Confirmation</span></h6></div>
    <center>
      <h4 id="hfourbd">Thank you, ${esc(b.contact.firstname)}! Your booking request has been received.</h4>
      <p id="txtresbd">Reference <b>${esc(b.ref)}</b>. A travel expert will call you at <b>${esc(b.contact.mobile)}</b> shortly to confirm the fare and issue the ticket. A copy of this itinerary goes to <b>${esc(b.contact.email)}</b>.</p>
    </center>
  </div></div>
  <div class="bookingdetailspage"><div class="container"><div class="row">
    <div class="col-sm-9"><div class="passengers2 pdetails2">
      <div class="main_bookdetails">
        <h4><span><i class="fa-solid fa-plane"></i></span> Itinerary Details</h4>
        <div class="data-show">
          <div class="row"><div class="col-sm-9">
            <div class="result-nav">${navRow(out)}</div>
            ${offer.itineraries[1] ? `<div class="first"></div><div class="result-nav second">${navRow(legInfo(offer.itineraries[1]))}</div>` : ''}
          </div><div class="col-sm-3"><div class="pricebar"><div class="hrborder"></div><h2>${cur} ${money(b.fare.grandTotal)}</h2><p>Incl. taxes &amp; fees</p></div></div></div>
        </div>
        ${detailsBox(offer, 'collapseExample', 'b_fdeails show')}
      </div>
      <div class="main_bookdetails passengers"><div class="Payment_info pdetails">
        <div class="heading-whitebox"><h6><span><i class="fa-solid fa-users"></i></span> Travellers</h6></div>
        <div class="info"><ul style="list-style:none;padding:0 0 10px 0;">${paxRows}</ul></div>
      </div></div>
    </div></div>
    <div class="col-sm-3" id="des_top"><div class="main_bookdetails passengers">
      <div class="Payment_info pdetails pderesdesk">
        <div class="heading-whitebox"><h6><span><i class="fa-solid fa-ticket"></i></span> Fare Details</h6>${tripSidebox(offer)}</div>
        <div class="info">${fareTables(offer, b.ctx, b.fare, false)}</div>
      </div>
    </div></div>
  </div></div></div>`;
}

module.exports = {
  card, list, filterSidebar, sortBar,
  bookingItinerary, bookingBaggage, bookingFareMobileAndPax, bookingFareSidebar, bookingScript, thankYou,
};
