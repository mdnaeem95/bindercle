// Bindercle landing-site analytics.
//
// One shared script across index/privacy/terms/support so any future
// change (e.g. adding a UTM param, swapping projects) happens in one
// place. Loaded synchronously from <head> so capture starts as early
// as possible.
//
// Cross-platform attribution model: the mobile app's
// `acquisition_source_reported` event and this page's `landing_page_view`
// share the same `source` value taxonomy (tiktok / instagram / reddit /
// friend / press / other), so PostHog funnel queries can join across
// platforms on property value — no per-user identify magic required.

// --- PostHog loader (inline snippet from PostHog dashboard) ----------
!(function (t, e) {
  var o, n, p, r;
  e.__SV ||
    ((window.posthog = e),
    (e._i = []),
    (e.init = function (i, s, a) {
      function g(t, e) {
        var o = e.split('.');
        2 == o.length && ((t = t[o[0]]), (e = o[1])),
          (t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          });
      }
      ((p = t.createElement('script')).type = 'text/javascript'),
        (p.crossOrigin = 'anonymous'),
        (p.async = !0),
        (p.src =
          s.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js'),
        (r = t.getElementsByTagName('script')[0]).parentNode.insertBefore(p, r);
      var u = e;
      for (
        void 0 !== a ? (u = e[a] = []) : (a = 'posthog'),
          u.people = u.people || [],
          u.toString = function (t) {
            var e = 'posthog';
            return 'posthog' !== a && (e += '.' + a), t || (e += ' (stub)'), e;
          },
          u.people.toString = function () {
            return u.toString(1) + '.people (stub)';
          },
          o =
            'capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId'.split(
              ' ',
            ),
          n = 0;
        n < o.length;
        n++
      )
        g(u, o[n]);
      e._SV = 1;
      // Queue the init args so array.js can replay them on the real instance.
      // Without this push, array.js loads with an empty _i queue and falls back
      // to its hardcoded default api_host (us.i.posthog.com) — the real init
      // never receives the EU host or our API key, so __loaded stays false and
      // no capture() POSTs ever fire. The version of the PostHog dashboard
      // snippet we pasted in originally was missing this line.
      e._i.push([i, s, a]);
    }));
})(document, window.posthog || []);

// Same project as the mobile app — values match across web + native
// so cross-platform funnel breakdowns are joinable on `acquisition_source`.
posthog.init('phc_yGEWVb2WYaVhpiAHokrMPX4q9QLdxiU9pbjsWorhkmDr', {
  api_host: 'https://eu.i.posthog.com',
  // Keep auto $pageview (path analysis) AND auto click capture (CTA tracking).
  // Session replay off — we want product analytics, not behavioral recording.
  disable_session_recording: true,
});

// --- Attribution capture --------------------------------------------
(function () {
  var params = new URLSearchParams(window.location.search);
  var src = params.get('src');
  var utmSource = params.get('utm_source');
  var utmMedium = params.get('utm_medium');
  var utmCampaign = params.get('utm_campaign');

  // ?src= is the canonical channel identifier; utm_source is the fallback
  // for links built by external tools that don't know about our convention.
  var source = src || utmSource || null;

  if (source) {
    // Super-property: attaches to every subsequent event in this session
    // (e.g. autocapture clicks on the TestFlight CTA carry the source).
    posthog.register({ acquisition_source: source });
  }

  posthog.capture('landing_page_view', {
    page: window.location.pathname,
    source: source,
    utm_source: utmSource || null,
    utm_medium: utmMedium || null,
    utm_campaign: utmCampaign || null,
  });
})();
