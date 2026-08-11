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

    /* Booking: la card Prova Gratuita resta neutra. Il colore arriva solo
       dopo la scelta CrossFit / HYROX / Consigliatemi voi nel form. */
    body.booking-page {
      --trial-accent:#d8d5cc;
      --trial-accent-rgb:216,213,204;
      --trial-accent-text:#111;
    }

    body.booking-page.booking-trial-crossfit {
      --trial-accent:#bc162f;
      --trial-accent-rgb:188,22,47;
      --trial-accent-text:#fff;
    }

    body.booking-page.booking-trial-hyrox {
      --trial-accent:#d7ff00;
      --trial-accent-rgb:215,255,0;
      --trial-accent-text:#050505;
    }

    body.booking-page.booking-trial-neutral {
      --trial-accent:#d8d5cc;
      --trial-accent-rgb:216,213,204;
      --trial-accent-text:#111;
    }

    body.booking-page .booking-card[data-type="prova"] {
      border-color:rgba(255,255,255,.22);
      box-shadow:none;
    }

    body.booking-page .booking-card[data-type="prova"] .booking-card-tag {
      color:#111;
      border-color:#d8d5cc;
      background:#d8d5cc;
    }

    body.booking-page .booking-card[data-type="prova"] .booking-card-cta {
      color:#fff;
      border-color:rgba(255,255,255,.58);
      background:transparent;
    }

    body.booking-page .booking-card[data-type="prova"]:hover {
      border-color:rgba(255,255,255,.5);
    }

    body.booking-page .booking-card[data-type="prova"]:focus-visible {
      outline-color:#d8d5cc;
    }

    body.booking-page .booking-card[data-type="prova"].is-active {
      border-color:#d8d5cc;
      box-shadow:0 0 0 4px rgba(216,213,204,.08),0 24px 50px rgba(0,0,0,.16);
    }

    body.booking-page .booking-card[data-type="prova"].is-active .booking-card-tag {
      color:#111;
      border-color:#d8d5cc;
      background:#d8d5cc;
    }

    body.booking-page .booking-card[data-type="prova"].is-active .booking-card-cta {
      color:#111;
      border-color:#d8d5cc;
      background:#d8d5cc;
    }

    body.booking-page #form-prova {
      border-color:rgba(var(--trial-accent-rgb),.22);
      box-shadow:0 0 0 1px rgba(var(--trial-accent-rgb),.04),0 24px 80px rgba(0,0,0,.16),0 4px 20px rgba(0,0,0,.1);
      transition:border-color .22s ease,box-shadow .22s ease;
    }

    body.booking-page #booking-form-prova {
      --booking-accent:var(--trial-accent);
      --booking-accent-soft:rgba(var(--trial-accent-rgb),.14);
      --booking-accent-filled:rgba(var(--trial-accent-rgb),.4);
      --booking-accent-text:var(--trial-accent-text);
    }

    body.booking-page #form-prova .req {
      color:var(--trial-accent);
    }

    body.booking-page #form-prova .booking-class-picker:focus-visible {
      border-color:var(--trial-accent);
      box-shadow:0 0 0 3px rgba(var(--trial-accent-rgb),.12);
    }

    body.booking-page #form-prova .booking-class-picker.has-value {
      border-color:rgba(var(--trial-accent-rgb),.42);
      background:#141414;
    }

    body.booking-page #form-prova .booking-class-picker-icon,
    body.booking-page #form-prova .booking-class-picker-copy small {
      color:var(--trial-accent);
    }

    body.booking-page .booking-dialog-close:hover {
      border-color:var(--trial-accent);
      color:var(--trial-accent);
    }

    body.booking-page .booking-dialog-close:focus-visible,
    body.booking-page .booking-dialog-day:focus-visible,
    body.booking-page .booking-dialog-option:focus-visible {
      outline-color:var(--trial-accent);
    }

    body.booking-page .booking-dialog-day.is-selected,
    body.booking-page .booking-dialog-option.is-selected {
      color:var(--trial-accent-text);
      background:var(--trial-accent);
      border-color:var(--trial-accent);
    }

    body.booking-page #form-prova .booking-submit {
      color:var(--trial-accent-text);
      background:var(--trial-accent);
    }

    body.booking-page #form-prova .booking-submit:hover {
      color:var(--trial-accent-text);
      background:var(--trial-accent);
      filter:brightness(1.08);
      transform:translateY(-2px);
    }

    body.booking-page #form-prova .booking-success-check {
      color:var(--trial-accent);
      border-color:var(--trial-accent);
      background:rgba(var(--trial-accent-rgb),.12);
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

  // Tema dinamico del form prova gratuita.
  // CrossFit = rosso, HYROX = lime, "Consigliatemi voi" = neutro.
  const trialTypeInputs = Array.from(document.querySelectorAll('#booking-form-prova input[name="tipo-prova"]'));
  const applyTrialTheme = () => {
    if (!document.body.classList.contains("booking-page")) return;
    const selected = trialTypeInputs.find(input => input.checked)?.value || "";
    document.body.classList.remove("booking-trial-crossfit", "booking-trial-hyrox", "booking-trial-neutral");

    if (selected === "CrossFit") {
      document.body.classList.add("booking-trial-crossfit");
    } else if (selected === "HYROX") {
      document.body.classList.add("booking-trial-hyrox");
    } else {
      document.body.classList.add("booking-trial-neutral");
    }
  };

  if (trialTypeInputs.length) {
    trialTypeInputs.forEach(input => input.addEventListener("change", applyTrialTheme));
    applyTrialTheme();
  }

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
