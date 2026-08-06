const IS_MOBILE = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
const ROWER_ACTIVE_FRAMES = IS_MOBILE ? ROWER_FRAMES_MOBILE : ROWER_FRAMES_DESKTOP;
const SKIERG_ACTIVE_FRAMES = IS_MOBILE ? SKIERG_FRAMES_MOBILE : SKIERG_FRAMES_DESKTOP;
const ROWER_TOTAL  = document.getElementById('canvas-rower')  ? ROWER_ACTIVE_FRAMES.length  : 0;
const SKIERG_TOTAL = document.getElementById('canvas-skierg') ? SKIERG_ACTIVE_FRAMES.length : 0;
const _sledPrecount = (typeof SLED_FRAMES_DESKTOP !== 'undefined' && document.getElementById('canvas-sled')) ? (IS_MOBILE ? SLED_FRAMES_MOBILE : SLED_FRAMES_DESKTOP).length : 0;
let TOTAL_ASSETS = ROWER_TOTAL + SKIERG_TOTAL + _sledPrecount;
const getScrollTop = () => document.documentElement.scrollTop || window.scrollY || 0;
const DEBUG_SCROLL = false;
const homeMobileMQ = window.matchMedia('(max-width: 767px)');
const homeScrollTriggers = [];
const hasHomeMotionRuntime = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

if (!hasHomeMotionRuntime) {
  window.ScrollTrigger = {
    config() {},
    create() { return { kill() {} }; },
    getAll() { return []; },
    refresh() {}
  };
  window.gsap = {
    registerPlugin() {},
    set() {},
    to() {},
    utils: {
      toArray(selector) {
        return Array.from(document.querySelectorAll(selector));
      }
    }
  };
}

const killHomeScrollTriggers = () => {
  while (homeScrollTriggers.length) {
    const trigger = homeScrollTriggers.pop();
    if (trigger) trigger.kill(true);
  }
};

const applyHomeMobileCleanup = () => {
  if (!document.body || !document.body.classList.contains('home-page')) return;
  killHomeScrollTriggers();
  ScrollTrigger.getAll().forEach(trigger => {
    const target = trigger.vars && trigger.vars.trigger;
    if (!target || !target.closest || !target.closest('body.home-page')) return;
    trigger.kill(true);
  });
  document.querySelectorAll(
    'body.home-page .rUp,body.home-page .rL,body.home-page .intro-hero-copy,body.home-page .why-ticker,body.home-page .why-ticker-track,body.home-page .why-ticker-mask'
  ).forEach(el => {
    el.style.opacity = '1';
    el.style.visibility = 'visible';
    el.style.transform = 'none';
  });
  ScrollTrigger.refresh();
};

if (homeMobileMQ.addEventListener) {
  homeMobileMQ.addEventListener('change', event => {
    if (event.matches) applyHomeMobileCleanup();
  });
} else if (homeMobileMQ.addListener) {
  homeMobileMQ.addListener(event => {
    if (event.matches) applyHomeMobileCleanup();
  });
}

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize:true });
if (hasHomeMotionRuntime) document.documentElement.classList.add('gsap-scroll');
if (homeMobileMQ.matches) applyHomeMobileCleanup();

const lbEl     = document.getElementById('lb');
const loaderEl = document.getElementById('loader');
let loadedN = 0;
function onLoad() {
  loadedN++;
  lbEl.style.width = (loadedN / TOTAL_ASSETS * 100) + '%';
  if (loadedN >= TOTAL_ASSETS) loaderEl.classList.add('done');
}
if (TOTAL_ASSETS === 0 && loaderEl) loaderEl.classList.add('done');
if (IS_MOBILE) {
  setTimeout(() => loaderEl.classList.add('done'), 4500);
}

/* NAV — dark at top (wolf screen), light as soon as user scrolls */
const navEl = document.getElementById('nav');
function updateNav() {
  const st = getScrollTop();
  navEl.classList.toggle('solid',        st > 60); /* compact padding */
  navEl.classList.toggle('header--light', st > 5);  /* white nav when scrolled */
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

/* REVEAL */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); } });
}, { threshold:.15 });
document.querySelectorAll('.rUp,.rL').forEach(el => io.observe(el));

const co = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.querySelectorAll('.sn[data-target]').forEach(n => {
      const t = +n.dataset.target; let s = null;
      (function a(ts) {
        if (!s) s = ts;
        const p = Math.min((ts-s)/1600, 1), ease = 1-Math.pow(1-p,3);
        n.textContent = Math.round(ease*t) + (p>=1?'+':'');
        if (p < 1) requestAnimationFrame(a);
      })(performance.now());
    });
    co.unobserve(e.target);
  });
}, { threshold:.5 });
document.querySelectorAll('#strip').forEach(el => co.observe(el));

const bgVideo   = document.getElementById('bg-video');

const introHeroCopy = document.querySelector('.intro-hero-copy');
if (introHeroCopy) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(introHeroCopy, { autoAlpha:1, y:0 });
  } else {
    gsap.to(introHeroCopy, { autoAlpha:1, y:0, duration:.65, delay:.15, ease:'power3.out' });
  }
}

/* WHY PHRASE WHEEL — compact adaptation of the previous centered wheel */
const whySection = document.getElementById('why');
const whyPhrases = whySection ? Array.from(whySection.querySelectorAll('.why-wheel-phrase')) : [];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (whySection && whyPhrases.length > 1 && !prefersReducedMotion) {
  let whyPhraseIndex = 0;
  let whyPhraseTimer = null;
  const updateWhyWheel = () => {
    whyPhrases.forEach((phrase, index) => {
      const offset = (index - whyPhraseIndex + whyPhrases.length) % whyPhrases.length;
      phrase.classList.remove('is-current', 'is-next', 'is-prev', 'is-back');
      phrase.classList.add(offset === 0 ? 'is-current' : offset === 1 ? 'is-next' : offset === whyPhrases.length - 1 ? 'is-prev' : 'is-back');
    });
  };
  const rotateWhyWheel = () => {
    whyPhraseIndex = (whyPhraseIndex + 1) % whyPhrases.length;
    updateWhyWheel();
  };
  const startWhyWheel = () => {
    if (!whyPhraseTimer) whyPhraseTimer = window.setInterval(rotateWhyWheel, 3000);
  };
  const stopWhyWheel = () => {
    window.clearInterval(whyPhraseTimer);
    whyPhraseTimer = null;
  };
  const whyPhraseObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? startWhyWheel() : stopWhyWheel());
  }, { threshold:.2 });
  updateWhyWheel();
  whyPhraseObserver.observe(whySection);
}

/* EQUIPMENT PLAYER */
function makePlayer(opts) {
  const { canvasId, loaderId, lbarId, sceneId, paId, pbId, pcId, hintId, progId, frames, total } = opts;
  const cv  = document.getElementById(canvasId);
  if (!cv) return;
  const ctx = cv.getContext('2d', { alpha:false });
  const lo  = document.getElementById(loaderId);
  const lb2 = document.getElementById(lbarId);
  const scene = document.getElementById(sceneId);
  const pin = scene.querySelector('.eq-pin');
  const stackSection = scene.closest('.equipment-stack-section');
  const isStackCard = !!stackSection;
  const stackCards = isStackCard ? gsap.utils.toArray('.equipment-card-stack-item') : [];
  const stackIndex = isStackCard ? stackCards.indexOf(scene) : 0;
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
  const mobileStatic = homeMobileMQ.matches;
  function resize() {
    const r = pin.getBoundingClientRect();
    cv.width = Math.max(1, Math.round(r.width * dpr()));
    cv.height = Math.max(1, Math.round(r.height * dpr()));
  }
  const imgs = frames.map(src => { const i=new Image(); i.src=src; return i; });
  let ld=0, rdy=false, cur=0, tgt=0, firstPainted=false;
  function paint(idx) {
    const f = imgs[Math.max(0, Math.min(total-1, Math.round(idx)))];
    if (!f||!f.complete||!f.naturalWidth) return;
    const cw=cv.width, ch=cv.height, iw=f.naturalWidth||1440, ih=f.naturalHeight||810;
    const s = Math.max(cw/iw, ch/ih);
    ctx.drawImage(f, (cw-iw*s)/2, (ch-ih*s)/2, iw*s, ih*s);
  }
  function updateFromProgress(p) {
    tgt = p*(total-1);
    const pa=document.getElementById(paId), pb=pbId&&document.getElementById(pbId), pc=pcId&&document.getElementById(pcId);
    const hint=document.getElementById(hintId), prog=document.getElementById(progId);
    const pcTiming = sceneId === 'eq-rower' ? [.58,.70] : [.72,.86];
    if(pa){const op=fd(p,0,.05,.28,.44);pa.style.opacity=op;pa.style.transform='translateY('+(p<.28?0:-(1-op)*40)+'px)';}
    if(pb){const op=fd(p,.38,.52,.62,.76);pb.style.opacity=op;pb.style.transform='translateY('+(p<.45?Math.max(0,24*(1-(p-.38)/.14)):0)+'px)';}
    if(pc){const op=fd(p,pcTiming[0],pcTiming[1]);pc.style.opacity=op;pc.style.transform='translateY('+(p<pcTiming[1]?Math.max(0,24*(1-(p-pcTiming[0])/(pcTiming[1]-pcTiming[0]))):0)+'px)';}
    if(hint) hint.style.opacity = Math.max(0, 1-p*5);
    if(prog) prog.style.width   = (p*100)+'%';
    if (DEBUG_SCROLL) console.log(sceneId, p.toFixed(3));
  }
  function handleResize() {
    resize();
    paint(cur);
    ScrollTrigger.refresh();
  }
  resize();
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', handleResize);
  imgs.forEach(img => {
    let counted = false;
    const done = () => {
      if (counted) return;
      counted = true;
      ld++;
      lb2.style.width=(ld/total*100)+'%';
      if(!firstPainted && img.complete && img.naturalWidth){firstPainted=true;paint(imgs.indexOf(img));}
      else if(firstPainted){paint(cur);}
      if(ld===total){rdy=true;lo.classList.add('done');paint(cur);if(!mobileStatic)ScrollTrigger.refresh();}
      onLoad();
    };
    if (img.complete) done(); else { img.onload = done; img.onerror = done; }
  });
  function fd(p,i0,i1,o0,o1) {
    if(p<i0)return 0; if(p<i1)return(p-i0)/(i1-i0);
    if(o0===undefined)return 1; if(p<o0)return 1; if(p<o1)return 1-(p-o0)/(o1-o0); return 0;
  }
  if (mobileStatic) {
    updateFromProgress(0);
    paint(0);
    return;
  }
  if (isStackCard) {
    const st = ScrollTrigger.create({
      trigger:stackSection,
      start:'top top',
      end:'bottom bottom',
      scrub:true,
      invalidateOnRefresh:true,
      markers:DEBUG_SCROLL,
      onUpdate:self => {
        const count = Math.max(1, stackCards.length);
        const local = clamp((self.progress * count) - stackIndex, 0, 1);
        updateFromProgress(local);
      }
    });
    homeScrollTriggers.push(st);
  } else {
    const st = ScrollTrigger.create({
      trigger:scene,
      start:'top top',
      end:'bottom bottom',
      pin:pin,
      pinSpacing:false,
      scrub:IS_MOBILE ? .16 : .3,
      anticipatePin:1,
      invalidateOnRefresh:true,
      markers:DEBUG_SCROLL,
      onUpdate:self => updateFromProgress(self.progress)
    });
    homeScrollTriggers.push(st);
  }
  updateFromProgress(0);
  (function loop() { if((rdy||firstPainted)&&Math.abs(tgt-cur)>0.05){cur+=(tgt-cur)*.08;paint(cur);} requestAnimationFrame(loop); })();
}

makePlayer({ canvasId:'canvas-rower',  loaderId:'loader-rower',  lbarId:'lbar-rower',  sceneId:'eq-rower',  paId:'pa-rower',  pbId:'pb-rower',  pcId:'pc-rower',  hintId:'hint-rower',  progId:'prog-rower',  frames:ROWER_ACTIVE_FRAMES,  total:ROWER_TOTAL  });
makePlayer({ canvasId:'canvas-skierg', loaderId:'loader-skierg', lbarId:'lbar-skierg', sceneId:'eq-skierg', paId:'pa-skierg', pbId:'pb-skierg', pcId:'pc-skierg', hintId:'hint-skierg', progId:'prog-skierg', frames:SKIERG_ACTIVE_FRAMES, total:SKIERG_TOTAL });
if (bgVideo) bgVideo.addEventListener('loadedmetadata', () => ScrollTrigger.refresh(), { once:true });
window.addEventListener('load', () => ScrollTrigger.refresh());

const capacityGalleryImages = Array.from(
  { length:19 },
  (_, index) => `assets/img/capacita-gallery/${String(index + 1).padStart(2, '0')}.webp`
);

const capacityGallery = document.querySelector('[data-capacity-gallery]');
if (capacityGallery && !capacityGallery.dataset.initialized) {
  capacityGallery.dataset.initialized = 'true';
  const capacityGalleryCount = capacityGalleryImages.length;
  const viewport = document.createElement('div');
  viewport.className = 'capacity-gallery__viewport';
  const track = document.createElement('div');
  track.className = 'capacity-gallery__track';

  const makePhoto = (src, index, className, lazy = true) => {
    const item = document.createElement('div');
    item.className = className;

    const image = document.createElement('img');
    image.alt = '';
    image.decoding = 'async';
    if (lazy) image.loading = 'lazy';
    image.addEventListener('error', () => image.remove());
    image.src = src;

    item.append(image);
    return item;
  };

  const makeGroup = () => {
    const group = document.createElement('div');
    group.className = 'capacity-gallery__group';

    capacityGalleryImages.forEach((src, index) => {
      group.append(makePhoto(src, index, 'capacity-gallery__item', index >= 4));
    });
    return group;
  };

  const firstGroup = makeGroup();
  const clonedGroup = firstGroup.cloneNode(true);
  clonedGroup.setAttribute('aria-hidden', 'true');
  clonedGroup.querySelectorAll('img').forEach(image => {
    image.loading = 'lazy';
    image.addEventListener('error', () => image.remove());
  });
  track.append(firstGroup, clonedGroup);
  viewport.append(track);

  const controls = document.createElement('div');
  controls.className = 'capacity-gallery-controls';
  controls.innerHTML = `
    <button class="capacity-gallery-arrow capacity-gallery-arrow--prev" type="button" aria-label="Foto precedente">←</button>
    <span class="capacity-gallery-counter" aria-live="polite">01 / ${String(capacityGalleryCount).padStart(2, '0')}</span>
    <button class="capacity-gallery-arrow capacity-gallery-arrow--next" type="button" aria-label="Foto successiva">→</button>
    <a href="#" class="capacity-gallery-all">VEDI TUTTE LE FOTO →</a>
  `;
  capacityGallery.append(viewport, controls);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const counter = controls.querySelector('.capacity-gallery-counter');
  const prevButton = controls.querySelector('.capacity-gallery-arrow--prev');
  const nextButton = controls.querySelector('.capacity-gallery-arrow--next');
  const allButton = controls.querySelector('.capacity-gallery-all');
  let resizeTimer;
  let galleryIsVisible = true;
  let offset = 0;
  let targetOffset = null;
  let cycleWidth = 1;
  let photoStep = 1;
  let lastFrame = performance.now();
  let resumeTimer;
  let interactionPaused = false;
  let dragging = false;
  let dragStartX = 0;
  let dragStartOffset = 0;

  const normalize = value => ((value % cycleWidth) + cycleWidth) % cycleWidth;
  const updateCounter = () => {
    const index = Math.floor(normalize(offset) / photoStep) % capacityGalleryCount;
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(capacityGalleryCount).padStart(2, '0')}`;
  };
  const renderGallery = () => {
    track.style.transform = `translate3d(${-normalize(offset)}px,0,0)`;
    updateCounter();
  };
  const pauseForInteraction = () => {
    interactionPaused = true;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      interactionPaused = false;
    }, 3000);
  };
  const measureGallery = () => {
    const previousProgress = normalize(offset) / cycleWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    cycleWidth = firstGroup.getBoundingClientRect().width + gap;
    const firstItem = firstGroup.querySelector('.capacity-gallery__item');
    photoStep = firstItem.getBoundingClientRect().width + gap;
    offset = previousProgress * cycleWidth;
    targetOffset = null;
    renderGallery();
  };
  const moveOnePhoto = direction => {
    pauseForInteraction();
    targetOffset = offset + direction * photoStep;
  };
  const galleryLoop = now => {
    const delta = Math.min(40, now - lastFrame);
    lastFrame = now;
    if (targetOffset !== null) {
      offset += (targetOffset - offset) * Math.min(1, delta / 180);
      if (Math.abs(targetOffset - offset) < .5) {
        offset = targetOffset;
        targetOffset = null;
      }
    } else if (!reducedMotion.matches && galleryIsVisible && !dragging && !interactionPaused && !lightbox.classList.contains('is-open')) {
      offset += (window.innerWidth < 768 ? 72 : 105) * delta / 1000;
    }
    if (Math.abs(offset) > cycleWidth * 2) offset = normalize(offset);
    renderGallery();
    requestAnimationFrame(galleryLoop);
  };

  const galleryObserver = new IntersectionObserver(([entry]) => {
    galleryIsVisible = entry.isIntersecting;
  }, { threshold:.01 });

  viewport.addEventListener('pointerdown', event => {
    dragging = true;
    targetOffset = null;
    dragStartX = event.clientX;
    dragStartOffset = offset;
    viewport.classList.add('is-dragging');
    viewport.setPointerCapture(event.pointerId);
    pauseForInteraction();
  });
  viewport.addEventListener('pointermove', event => {
    if (!dragging) return;
    offset = dragStartOffset - (event.clientX - dragStartX);
  });
  const endDrag = event => {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('is-dragging');
    if (event?.pointerId !== undefined && viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    pauseForInteraction();
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('mouseleave', endDrag);
  viewport.addEventListener('touchend', endDrag, { passive:true });
  prevButton.addEventListener('click', () => moveOnePhoto(-1));
  nextButton.addEventListener('click', () => moveOnePhoto(1));

  const lightbox = document.createElement('div');
  lightbox.className = 'capacity-lightbox';
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.innerHTML = `
    <button class="capacity-lightbox__close" type="button" aria-label="Chiudi gallery">×</button>
    <div class="capacity-lightbox__grid"></div>
    <div class="capacity-lightbox__viewer">
      <button class="capacity-lightbox__viewer-arrow capacity-lightbox__viewer-arrow--prev" type="button" aria-label="Foto precedente">←</button>
      <div class="capacity-lightbox__viewer-media"></div>
      <button class="capacity-lightbox__viewer-arrow capacity-lightbox__viewer-arrow--next" type="button" aria-label="Foto successiva">→</button>
    </div>
  `;
  document.body.append(lightbox);
  const lightboxGrid = lightbox.querySelector('.capacity-lightbox__grid');
  const viewer = lightbox.querySelector('.capacity-lightbox__viewer');
  const viewerMedia = lightbox.querySelector('.capacity-lightbox__viewer-media');
  let viewerIndex = 0;

  const showViewerPhoto = index => {
    pauseForInteraction();
    viewerIndex = (index + capacityGalleryCount) % capacityGalleryCount;
    viewerMedia.replaceChildren(makePhoto(capacityGalleryImages[viewerIndex], viewerIndex, 'capacity-lightbox__item', false));
    viewer.classList.add('is-open');
  };
  capacityGalleryImages.forEach((src, index) => {
    const item = makePhoto(src, index, 'capacity-lightbox__item');
    item.addEventListener('click', () => showViewerPhoto(index));
    lightboxGrid.append(item);
  });
  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    viewer.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('capacity-lightbox-open');
    pauseForInteraction();
  };
  allButton.addEventListener('click', event => {
    event.preventDefault();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('capacity-lightbox-open');
    pauseForInteraction();
  });
  lightbox.querySelector('.capacity-lightbox__close').addEventListener('click', closeLightbox);
  lightbox.querySelector('.capacity-lightbox__viewer-arrow--prev').addEventListener('click', () => showViewerPhoto(viewerIndex - 1));
  lightbox.querySelector('.capacity-lightbox__viewer-arrow--next').addEventListener('click', () => showViewerPhoto(viewerIndex + 1));
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox || event.target === viewer) closeLightbox();
  });
  document.addEventListener('keydown', event => {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      if (viewer.classList.contains('is-open')) viewer.classList.remove('is-open');
      else closeLightbox();
    }
    if (viewer.classList.contains('is-open') && event.key === 'ArrowLeft') showViewerPhoto(viewerIndex - 1);
    if (viewer.classList.contains('is-open') && event.key === 'ArrowRight') showViewerPhoto(viewerIndex + 1);
  });

  galleryObserver.observe(capacityGallery);
  requestAnimationFrame(measureGallery);
  window.addEventListener('load', measureGallery, { once:true });
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measureGallery, 180);
  });
  reducedMotion.addEventListener('change', pauseForInteraction);
  requestAnimationFrame(galleryLoop);
}
