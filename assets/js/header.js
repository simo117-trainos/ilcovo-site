(() => {
  const mobileUiStyle = document.createElement("style");
  mobileUiStyle.setAttribute("data-mobile-ui-fixes", "");
  mobileUiStyle.textContent = `
    @media (max-width:899px) {
      nav#nav.site-header .nav-links,
      .hyrox-page nav#nav.site-header .nav-links,
      .cf-page nav#nav.site-header .nav-links {
        left:auto;
        right:20px;
        width:min(calc(100vw - 40px),1680px);
        max-width:calc(100vw - 40px);
        transform:translateY(-10px);
      }

      nav#nav.site-header.nav-open .nav-links,
      .hyrox-page nav#nav.site-header.nav-open .nav-links,
      .cf-page nav#nav.site-header.nav-open .nav-links {
        transform:translateY(0);
      }
    }

    .testi-video-play {
      display:none;
    }

    @media (max-width:767px) {
      .testi-video-play {
        position:absolute;
        top:50%;
        left:50%;
        z-index:3;
        display:grid;
        place-items:center;
        width:58px;
        height:58px;
        padding:0;
        border:1px solid rgba(255,255,255,.72);
        border-radius:50%;
        color:#fff;
        background:rgba(0,0,0,.58);
        box-shadow:0 8px 30px rgba(0,0,0,.28);
        transform:translate(-50%,-50%);
        cursor:pointer;
        -webkit-tap-highlight-color:transparent;
        backdrop-filter:blur(5px);
      }

      .testi-video-play::before {
        content:"";
        width:0;
        height:0;
        margin-left:4px;
        border-top:8px solid transparent;
        border-bottom:8px solid transparent;
        border-left:13px solid currentColor;
      }

      .testi-video-play:focus-visible {
        outline:2px solid #fff;
        outline-offset:3px;
      }
    }
  `;
  document.head.appendChild(mobileUiStyle);

  // I CTA "Prova Gratuita" devono aprire la pagina di scelta senza
  // selezionare automaticamente il form. Manteniamo solo l'eventuale
  // disciplina (CrossFit/HYROX) come preselezione dopo il click sulla card.
  document.querySelectorAll('a[href*="/prenota-prova"]').forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;
    try {
      const url = new URL(href, window.location.origin);
      if (url.pathname.replace(/\/+$/, "") !== "/prenota-prova") return;
      if (url.searchParams.get("type") !== "trial") return;
      url.searchParams.delete("type");
      const query = url.searchParams.toString();
      link.setAttribute("href", `${url.pathname}${query ? `?${query}` : ""}${url.hash}`);
    } catch (_) {}
  });

  const nav = document.getElementById("nav");
  const toggle = nav?.querySelector(".nav-toggle");
  const links = nav?.querySelector(".nav-links");

  if (nav && toggle && links) {
    const closeMenu = () => {
      nav.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Apri menu");
    };

    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Chiudi menu" : "Apri menu");
    });

    links.addEventListener("click", event => {
      if (event.target.closest("a")) closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 900) closeMenu();
    });
  }

  const testimonialMq = window.matchMedia("(max-width: 767px)");

  const setupTestimonialPreviews = () => {
    document.querySelectorAll(".testi-video").forEach(video => {
      const wrap = video.closest(".testi-video-wrap");
      if (!wrap) return;

      let playButton = wrap.querySelector(".testi-video-play");

      if (!testimonialMq.matches) {
        video.controls = true;
        video.dataset.mobilePreview = "off";
        if (playButton) playButton.remove();
        return;
      }

      if (video.dataset.mobilePreview === "playing") return;

      video.controls = false;
      video.preload = "metadata";
      video.dataset.mobilePreview = "ready";

      if (!playButton) {
        playButton = document.createElement("button");
        playButton.type = "button";
        playButton.className = "testi-video-play";
        const name = video.closest(".testi-video-card")?.querySelector(".tw")?.textContent?.trim();
        playButton.setAttribute("aria-label", name ? `Riproduci la testimonianza di ${name}` : "Riproduci testimonianza");
        wrap.appendChild(playButton);
      }

      const startPlayback = event => {
        if (video.dataset.mobilePreview !== "ready") return;
        if (event) event.preventDefault();
        video.dataset.mobilePreview = "playing";
        video.controls = true;
        const currentButton = wrap.querySelector(".testi-video-play");
        if (currentButton) currentButton.remove();
        try {
          if (video.currentTime > 0 && video.currentTime <= 0.15) video.currentTime = 0;
        } catch (_) {}
        video.play().catch(() => {
          video.dataset.mobilePreview = "ready";
          video.controls = false;
          setupTestimonialPreviews();
        });
      };

      if (!video.dataset.mobilePreviewBound) {
        video.dataset.mobilePreviewBound = "true";
        video.addEventListener("click", event => {
          if (video.dataset.mobilePreview === "ready") startPlayback(event);
        });
      }

      playButton.onclick = startPlayback;
    });
  };

  setupTestimonialPreviews();
  if (testimonialMq.addEventListener) testimonialMq.addEventListener("change", setupTestimonialPreviews);
})();
