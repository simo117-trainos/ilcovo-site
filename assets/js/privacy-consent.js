(() => {
  "use strict";

  const PIXEL_ID = "2282714148548224";
  const STORAGE_KEY = "ilcovo_cookie_consent_v1";
  let pixelLoaded = false;

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
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    return consent;
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
    if (consent && consent.marketing) loadMetaPixel();
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
        <p>Usiamo cookie necessari e, solo con il tuo consenso, il Meta Pixel per misurare le campagne pubblicitarie.</p>
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
