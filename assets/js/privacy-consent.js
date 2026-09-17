(() => {
  "use strict";

  const PIXEL_ID = "2282714148548224";
  const GA_MEASUREMENT_ID = "G-PXTN4NG18Z";
  const STORAGE_KEY = "ilcovo_cookie_consent_v1";
  const ATTRIBUTION_KEY = "ilcovo_attribution_v1";
  let pixelLoaded = false;
  let gaLoaded = false;

  function getConsent() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function saveConsent(marketing) {
    const consent = {
      necessary: true,
      marketing: Boolean(marketing),
      analytics: Boolean(marketing),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    return consent;
  }

  function readStoredAttribution() {
    try {
      return JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || "null") || {};
    } catch {
      return {};
    }
  }

  function detectTrafficSource(attribution) {
    const utmSource = (attribution.utm_source || "").toLowerCase();
    const referrer = (attribution.referrer || "").toLowerCase();

    if (
      attribution.fbclid ||
      ["meta", "facebook", "instagram", "fb", "ig"].some(value => utmSource.includes(value)) ||
      referrer.includes("facebook.com") ||
      referrer.includes("instagram.com") ||
      referrer.includes("l.facebook.com")
    ) return "Meta Ads / Meta";

    if (utmSource) return `UTM: ${attribution.utm_source}`;
    if (referrer.includes("google.")) return "Google / organico";
    if (referrer) return "Referral";
    return "Diretto / organico";
  }

  function captureAttribution() {
    const stored = readStoredAttribution();
    const params = new URLSearchParams(window.location.search);
    const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    const attribution = {
      ...stored,
      landing_path: stored.landing_path || window.location.pathname,
      landing_url: stored.landing_url || `${window.location.origin}${window.location.pathname}${window.location.search}`,
      referrer: stored.referrer || document.referrer || "",
      fbclid: stored.fbclid || params.get("fbclid") || "",
      captured_at: stored.captured_at || new Date().toISOString()
    };

    utmKeys.forEach(key => {
      attribution[key] = stored[key] || params.get(key) || "";
    });
    attribution.traffic_source = detectTrafficSource(attribution);

    try {
      sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
    } catch {
      // Session storage unavailable: keep attribution in memory only.
    }
    return attribution;
  }

  let capturedAttribution = captureAttribution();
  window.ilCovoAttribution = () => ({ ...capturedAttribution });

  // Enriches only the IL COVO Make lead payload. This gives the CRM/email a
  // first-party acquisition source even when the user does not grant optional
  // measurement consent. The raw Meta click id is forwarded only with consent.
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function(input, init = {}) {
    const url = typeof input === "string" ? input : input?.url || "";
    if (url.includes("hook.eu1.make.com") && typeof init.body === "string") {
      try {
        const payload = JSON.parse(init.body);
        if (payload && payload.fonte_lead === "Sito IL COVO") {
          capturedAttribution = captureAttribution();
          const attr = capturedAttribution;

          payload.utm_source = payload.utm_source || attr.utm_source || "";
          payload.utm_medium = payload.utm_medium || attr.utm_medium || "";
          payload.utm_campaign = payload.utm_campaign || attr.utm_campaign || "";
          payload.utm_content = payload.utm_content || attr.utm_content || "";
          payload.utm_term = payload.utm_term || attr.utm_term || "";
          payload.traffic_source = attr.traffic_source || "";
          payload.landing_url = attr.landing_url || "";
          payload.referrer = attr.referrer || "";
          if (getConsent()?.marketing) payload.fbclid = attr.fbclid || "";

          const attributionSummary = [
            "",
            "Attribuzione:",
            `Sorgente: ${payload.traffic_source || "Non determinata"}`,
            `Landing: ${payload.landing_url || window.location.href}`,
            payload.utm_campaign ? `Campagna UTM: ${payload.utm_campaign}` : "",
            payload.utm_content ? `Creativita UTM: ${payload.utm_content}` : "",
            payload.referrer ? `Referrer: ${payload.referrer}` : ""
          ].filter(Boolean).join("\n");

          if (typeof payload.message === "string" && !payload.message.includes("\nAttribuzione:\n")) {
            payload.message += `\n${attributionSummary}`;
          }
          init = { ...init, body: JSON.stringify(payload) };
        }
      } catch {
        // Leave unrelated or non-JSON requests untouched.
      }
    }
    return nativeFetch(input, init);
  };

  function loadGoogleAnalytics() {
    if (gaLoaded || window.gtag) return;
    gaLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: true
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    document.head.appendChild(script);
  }

  function loadMetaPixel() {
    if (pixelLoaded || window.fbq) return;
    pixelLoaded = true;

    !(function(f,b,e,v,n,t,s) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    window.fbq("consent", "grant");
    window.fbq("init", PIXEL_ID);
    window.fbq("track", "PageView");
    window.dispatchEvent(new CustomEvent("ilcovo:marketing-consent"));
  }

  function applyConsent(consent) {
    if (!consent) return;
    if (consent.marketing) loadMetaPixel();
    // Backward compatibility: existing users only have `marketing` saved.
    if (consent.analytics || consent.marketing) loadGoogleAnalytics();
  }

  function removeBanner() {
    document.getElementById("ilcovo-cookie-banner")?.remove();
  }

  function showBanner(force = false) {
    if (!force && getConsent()) return;
    removeBanner();

    const banner = document.createElement("section");
    banner.id = "ilcovo-cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Preferenze cookie");
    banner.innerHTML = `
      <div class="ilcovo-cookie__copy">
        <strong>La tua privacy conta</strong>
        <p>Usiamo cookie necessari e, solo con il tuo consenso, Meta Pixel e Google Analytics per misurare traffico e campagne.</p>
        <a href="/cookie-policy">Leggi la Cookie Policy</a>
      </div>
      <div class="ilcovo-cookie__actions">
        <button type="button" data-cookie-reject>Rifiuta</button>
        <button type="button" class="is-primary" data-cookie-accept>Accetta</button>
      </div>`;

    const style = document.createElement("style");
    style.setAttribute("data-ilcovo-cookie-style", "");
    style.textContent = `
      #ilcovo-cookie-banner{position:fixed;z-index:2147483647;left:20px;right:20px;bottom:20px;display:flex;gap:24px;align-items:center;justify-content:space-between;max-width:1100px;margin:auto;padding:20px 22px;background:#151515;color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.4);font:16px/1.4 Arial,sans-serif}
      #ilcovo-cookie-banner strong{display:block;margin-bottom:5px;font-size:18px}
      #ilcovo-cookie-banner p{margin:0 0 5px}
      #ilcovo-cookie-banner a{color:#fff;text-decoration:underline}
      .ilcovo-cookie__actions{display:flex;gap:10px;flex-shrink:0}
      .ilcovo-cookie__actions button{padding:11px 18px;border:1px solid #fff;border-radius:999px;background:transparent;color:#fff;font-weight:700;cursor:pointer}
      .ilcovo-cookie__actions button.is-primary{background:#e32636;border-color:#e32636}
      @media(max-width:720px){#ilcovo-cookie-banner{left:12px;right:12px;bottom:12px;display:block;padding:18px}.ilcovo-cookie__actions{margin-top:14px}.ilcovo-cookie__actions button{flex:1}}
    `;
    if (!document.querySelector("[data-ilcovo-cookie-style]")) document.head.appendChild(style);
    document.body.appendChild(banner);

    banner.querySelector("[data-cookie-reject]").addEventListener("click", () => {
      saveConsent(false);
      if (window.fbq) window.fbq("consent", "revoke");
      removeBanner();
    });

    banner.querySelector("[data-cookie-accept]").addEventListener("click", () => {
      const consent = saveConsent(true);
      applyConsent(consent);
      removeBanner();
    });
  }

  window.ilCovoTrack = function(eventName, parameters = {}) {
    if (!getConsent()?.marketing) return false;
    if (!window.fbq) loadMetaPixel();
    window.fbq("track", eventName, parameters);
    return true;
  };

  window.ilCovoTrackAnalytics = function(eventName, parameters = {}) {
    const consent = getConsent();
    if (!(consent?.analytics || consent?.marketing)) return false;
    if (!window.gtag) loadGoogleAnalytics();
    window.gtag("event", eventName, parameters);
    return true;
  };

  // GA4 lead: fires only after booking.js confirms the Make webhook succeeded.
  // No PII is sent; the event inherits the session's source/campaign/UTM attribution.
  document.addEventListener("ilcovo:booking-success", event => {
    if (event.detail?.type !== "trial") return;

    const discipline = document.querySelector('#booking-form-prova input[name="tipo-prova"]:checked')?.value || "Prova";
    const isStartExperience = Boolean(document.querySelector('#booking-form-prova[data-start-experience="true"]'));

    window.ilCovoTrackAnalytics("generate_lead", {
      method: "website_form",
      content_name: isStartExperience ? "Start Experience" : "Prenotazione prova",
      content_category: discipline,
      lead_type: isStartExperience ? "start_experience" : "trial"
    });
  });

  function init() {
    const consent = getConsent();
    if (consent) applyConsent(consent);
    else showBanner();

    document.addEventListener("click", event => {
      const trigger = event.target.closest("[data-cookie-settings]");
      if (!trigger) return;
      event.preventDefault();
      showBanner(true);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();