/**
 * Corrections to the mirrored search.js.
 *
 * Kept in a separate file on purpose: ajax/search.js is a faithful copy of the original site's
 * script, so every deliberate behaviour change lives here where it can be reviewed.
 * Loaded AFTER search.js, so these handlers run last.
 */
(function () {
  'use strict';
  if (typeof jQuery === 'undefined') return;

  jQuery(function ($) {
    /* ------------------------------------------------------------------
     * FIX 1 — "Return" date stayed disabled after One Way -> Round Trip.
     *
     * The original script disables and clears #arrfield when One Way is picked, but nothing
     * re-enables it when the user switches back to Round Trip. A disabled input is not submitted,
     * so return_date never reached the server, the round-trip search failed validation and the
     * visitor was bounced to the home page with no explanation. Reproduced on the live original.
     * ------------------------------------------------------------------ */
    function enableReturnField() {
      $('#arrfield').prop('disabled', false).removeAttr('disabled');
      $('#ar_date_focus').show();
    }

    $(document).on('click change', '#round', enableReturnField);
    // the calendar has its own trip-type <select name="title13">
    $(document).on('change', 'select[name="title13"]', function () {
      if ($(this).val() === 'round') enableReturnField();
    });
    // whatever else ran before us, a round trip must always be able to submit a return date
    if ($('#round').is(':checked')) enableReturnField();

    /* ------------------------------------------------------------------
     * FIX 3 — exactly one departure-time slot may be highlighted.
     *
     * The original binds `$(document).on('click', '#depfrmval .a' …)` inside the getFilter
     * success callback, so every reload of the filter sidebar registers ANOTHER set of handlers
     * (observed: 16 handlers for 4 buttons after a few filter operations). They then fight over
     * the `activefil` class and leave up to three slots highlighted at once.
     *
     * That is not only cosmetic: several code paths gate on
     * `$("#depfrmval").find('button.activefil').length == 1`, so with more than one active button
     * the departure-time filter is silently dropped from combined filtering.
     *
     * Running last (setTimeout 0) lets the original handlers do their thing, then normalises to a
     * single active button.
     * ------------------------------------------------------------------ */
    $(document).on('click', '#depfrmval .btncallval', function () {
      var clicked = this;
      setTimeout(function () {
        $('#depfrmval .btncallval').removeClass('activefil');
        $(clicked).addClass('activefil');
      }, 0);
    });

    // "Reset filter" must also clear the time slot, otherwise a stale highlight keeps being
    // sent with the next combined filter request.
    $(document).on('click', '.uncheckreset_2', function () {
      setTimeout(function () { $('#depfrmval .btncallval').removeClass('activefil'); }, 0);
    });

    /* ------------------------------------------------------------------
     * FIX 2 — never submit a round trip without a return date.
     *
     * Last line of defence: if the field is somehow still empty, fall back to one way rather
     * than silently losing the search.
     * ------------------------------------------------------------------ */
    $('#searchbox').on('submit', function () {
      var isRound = $('#round').is(':checked');
      var ret = $.trim($('#arrfield').val() || '');
      if (isRound && !ret) {
        $('#oneway').prop('checked', true);
        $('#round').prop('checked', false);
        $('select[name="title13"]').val('oneway');
      }
      return true;
    });
  });
}());
