const IS_MOBILE = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
const ROWER_ACTIVE_FRAMES = IS_MOBILE ? ROWER_FRAMES_MOBILE : ROWER_FRAMES_DESKTOP;
const SKIERG_ACTIVE_FRAMES = IS_MOBILE ? SKIERG_FRAMES_MOBILE : SKIERG_FRAMES_DESKTOP;
const ROWER_TOTAL  = ROWER_ACTIVE_FRAMES.length;
const SKIERG_TOTAL = SKIERG_ACTIVE_FRAMES.length;
const TOTAL_ASSETS = ROWER_TOTAL + SKIERG_TOTAL;
const getVH = () => (window.visualViewport && window.visualViewport.height) || window.innerHeight;
const getScrollTop = () => document.documentElement.scrollTop || window.scrollY || 0;
const DEBUG_SCROLL = false;
const DEBUG_INTRO = false;
const INTRO_TEXT_DELAY_VH = 0.12;
const PHRASE_ENTER = 0.2;
const PHRASE_HOLD = 0.6;
const PHRASE_EXIT = 0.2;

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize:true });
document.documentElement.classList.add('gsap-scroll');

const lbEl     = document.getElementById('lb');
const loaderEl = document.getElementById('loader');
let loadedN = 0;
function onLoad() {
  loadedN++;
  lbEl.style.width = (loadedN / TOTAL_ASSETS * 100) + '%';
  if (loadedN >= TOTAL_ASSETS) loaderEl.classList.add('done');
}
if (IS_MOBILE) {
  setTimeout(() => loaderEl.classList.add('done'), 4500);
}

/* CURSOR */
const C = document.getElementById('cur'), R = document.getElementById('cur-r');
let mx=0, my=0, rx=0, ry=0;
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  C.style.left = mx+'px'; C.style.top = my+'px';
});
(function tick() { rx+=(mx-rx)*.12; ry+=(my-ry)*.12; R.style.left=rx+'px'; R.style.top=ry+'px'; requestAnimationFrame(tick); })();

/* NAV */
window.addEventListener('scroll', () => document.getElementById('nav').classList.toggle('solid', getScrollTop() > 60), { passive:true });

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

/* BG VIDEO — appare dopo che il wolf svanisce */
const bgVideo   = document.getElementById('bg-video');
const bgOverlay = document.getElementById('bg-overlay');
const introBottomPill = document.querySelector('.intro-bottom-pill');

/* INTRO SCROLL */
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const norm  = (v,a,b) => clamp((v-a)/(b-a), 0, 1);
const eOut  = (t,p=3) => 1-Math.pow(1-t,p);

function revealLines(el, show) {
  el.querySelectorAll('.li').forEach(l => { if(show) l.classList.add('up'); else l.classList.remove('up'); });
}

function oldOnIntroScrollDisabled() {
  const intro = document.getElementById('intro');
  const sy = getScrollTop() - intro.offsetTop;
  const vh = getVH();
  const iH = intro.offsetHeight;

  document.getElementById('iprog').style.width = (clamp(sy/(iH-vh),0,1)*100)+'%';
  document.getElementById('shint').style.opacity = Math.max(0, 1-sy/vh*3);

  /* Wolf: visibile da subito, esce tra 0.7-1.3vh */
  const wolfOut = eOut(norm(sy, 0.7*vh, 1.3*vh));
  const wolfEl  = document.getElementById('wolf-layer');
  wolfEl.style.opacity   = clamp(1-wolfOut, 0, 1);
  wolfEl.style.transform = 'scale(' + (0.92 + clamp(1-wolfOut,0,1)*0.08) + ')';

  /* BG video: appare quando il wolf sfuma */
  const bgIn = eOut(norm(sy, 0.8*vh, 1.4*vh));
  if (bgIn > 0.05) {
    bgVideo.classList.add('show');
    bgOverlay.classList.add('show');
  } else {
    bgVideo.classList.remove('show');
    bgOverlay.classList.remove('show');
  }

  /* Frasi — una alla volta */
  const PHRASES = [
    { id:'s0', a:1.0, b:2.2 },
    { id:'s1', a:2.1, b:3.3 },
    { id:'s2', a:3.2, b:4.4 },
    { id:'s3', a:4.3, b:5.5 },
    { id:'s4', a:5.4, b:6.6 },
  ];
  PHRASES.forEach(sc => {
    const pIn  = eOut(norm(sy, sc.a*vh,          (sc.a+0.25)*vh));
    const pOut = eOut(norm(sy, (sc.b-0.25)*vh,   sc.b*vh));
    const op   = pIn < 1 ? pIn : 1-pOut;
    const el   = document.getElementById(sc.id);
    el.style.opacity = clamp(op, 0, 1);
    revealLines(el, sy > sc.a*vh && sy < sc.b*vh);
  });

  /* CTA finale */
  const ctaEl = document.getElementById('cta-panel');
  const ctaIn = eOut(norm(sy, 6.5*vh, 7.0*vh));
  ctaEl.style.opacity = clamp(ctaIn, 0, 1);
  if (ctaIn > 0.5) {
    document.getElementById('cta-btns').classList.add('show');
    document.getElementById('cta-sub').classList.add('show');
  }
}
let introRaf = false;
function requestIntroScroll() {
  if (introRaf) return;
  introRaf = true;
  requestAnimationFrame(() => {
    introRaf = false;
    oldOnIntroScrollDisabled();
  });
}
function makeIntroTimeline(isMobile) {
  const intro = document.getElementById('intro');
  const pin = document.getElementById('intro-pin');
  const phrases = ['s0','s1','s2','s3','s4'].map(id => document.getElementById(id));
  const phraseBodies = phrases.map(el => el.querySelector('.pt'));
  const ctaPanel = document.getElementById('cta-panel');
  const ctaBtns = document.getElementById('cta-btns');
  const ctaSub = document.getElementById('cta-sub');
  const shint = document.getElementById('shint');
  const iprog = document.getElementById('iprog');
  const phraseDuration = PHRASE_ENTER + PHRASE_HOLD + PHRASE_EXIT;
  let lastIntroDebugIndex = null;

  gsap.set([bgVideo, bgOverlay, ctaBtns, ctaSub], { autoAlpha:0 });
  gsap.set(ctaPanel, { autoAlpha:0, y:18, pointerEvents:'none' });
  gsap.set([ctaBtns, ctaSub], { y:12 });
  gsap.set(introBottomPill, { autoAlpha:0, y:16, pointerEvents:'none' });
  gsap.set('#wolf-layer', { autoAlpha:1, scale:1 });
  gsap.set(phrases, { autoAlpha:0, visibility:'hidden', pointerEvents:'none' });
  gsap.set(phraseBodies, { autoAlpha:0, y:34, scale:.96, yPercent:0 });

  const tl = gsap.timeline({
    defaults:{ ease:'none' },
    scrollTrigger:{
      trigger:intro,
      start:'top top',
      end:'bottom bottom',
      pin:pin,
      pinSpacing:false,
      scrub:isMobile ? .18 : .35,
      anticipatePin:1,
      invalidateOnRefresh:true,
      markers:DEBUG_INTRO,
      onUpdate:self => {
        iprog.style.width = (self.progress * 100) + '%';
        if (shint) shint.style.opacity = Math.max(0, 1 - self.progress * 8);
        if (DEBUG_INTRO) {
          const localTime = tl.time() - INTRO_TEXT_DELAY_VH;
          const activeIndex = localTime >= 0 && localTime < phrases.length * phraseDuration
            ? Math.floor(localTime / phraseDuration)
            : -1;
          if (activeIndex !== lastIntroDebugIndex) {
            lastIntroDebugIndex = activeIndex;
            console.log('intro', {
              progress:self.progress.toFixed(3),
              activeIndex,
              visible:phrases.map(el => getComputedStyle(el).visibility)
            });
          }
        }
        if (DEBUG_SCROLL) console.log('intro', self.progress.toFixed(3));
      }
    }
  });

  function hideAllPhrases() {
    tl.set(phrases, { autoAlpha:0, visibility:'hidden', pointerEvents:'none' });
    tl.set(phraseBodies, { autoAlpha:0, y:34, scale:.96, yPercent:0 });
  }

  tl.to('#wolf-layer', { autoAlpha:0, scale:isMobile ? .9 : .92, duration:.16 }, 0);
  tl.to(bgVideo, { autoAlpha:1, duration:.14 }, .10);
  tl.to(bgOverlay, { autoAlpha:1, duration:.14 }, .10);
  tl.fromTo(introBottomPill,
    { autoAlpha:0, y:16, pointerEvents:'none' },
    { autoAlpha:1, y:0, pointerEvents:'auto', duration:.14, ease:'power2.out', immediateRender:false },
    .10
  );
  tl.to(shint, { autoAlpha:0, duration:.12 }, .10);
  tl.to({}, { duration:INTRO_TEXT_DELAY_VH });

  phrases.forEach((el, i) => {
    const body = phraseBodies[i];
    hideAllPhrases();
    tl.set(el, { autoAlpha:1, visibility:'visible', pointerEvents:'none' });
    tl.fromTo(body,
      { autoAlpha:0, y:34, scale:.96, yPercent:0 },
      { autoAlpha:1, y:0, scale:1, duration:PHRASE_ENTER, ease:'power3.out', immediateRender:false }
    );
    tl.to(body, { scale:1.04, duration:PHRASE_HOLD, ease:'none' });
    tl.to(body, { autoAlpha:0, y:-28, scale:1.04, duration:PHRASE_EXIT, ease:'power2.in' });
    tl.set(el, { autoAlpha:0, visibility:'hidden', pointerEvents:'none' });
  });

  hideAllPhrases();
  tl.addLabel('introCtaFinal');
  tl.to(ctaPanel, { autoAlpha:1, y:0, pointerEvents:'auto', duration:.2, ease:'power2.out' }, 'introCtaFinal');
  tl.to(ctaBtns, { autoAlpha:1, y:0, duration:.18, ease:'power2.out' }, 'introCtaFinal');
  tl.to(ctaSub, { autoAlpha:1, y:0, duration:.18, ease:'power2.out' }, 'introCtaFinal');
  return tl;
}

const scrollMM = gsap.matchMedia();
scrollMM.add({
  desktop:'(min-width: 768px)',
  mobile:'(max-width: 767px)'
}, ctx => {
  const introTl = makeIntroTimeline(ctx.conditions.mobile);
  return () => introTl.kill();
});

const exerciseShell = document.querySelector('.exercise-cards-shell');
const exerciseCards = exerciseShell ? gsap.utils.toArray('.exercise-card') : [];
if (exerciseCards.length) {
  gsap.set(exerciseCards, { autoAlpha:0, y:70, scale:.96 });
}

const equipmentStackSection = document.querySelector('.equipment-stack-section');
const equipmentCards = gsap.utils.toArray('.equipment-card-stack-item');
if (equipmentStackSection && equipmentCards.length) {
  function sizeEquipmentStack() {
    equipmentStackSection.style.height = (equipmentCards.length * (IS_MOBILE ? 245 : 280)) + 'vh';
  }
  sizeEquipmentStack();
  window.addEventListener('resize', sizeEquipmentStack);

  gsap.set(equipmentCards, {
    position:'absolute',
    autoAlpha:1,
    yPercent:i => i === 0 ? 0 : 120,
    scale:1,
    filter:'brightness(1)',
    zIndex:i => i + 1
  });

  const stackTl = gsap.timeline({
    defaults:{ ease:'none' },
    scrollTrigger:{
      trigger:equipmentStackSection,
      start:'top top',
      end:'bottom bottom',
      scrub:.8,
      invalidateOnRefresh:true,
      markers:DEBUG_SCROLL
    }
  });

  const exerciseMainCard = document.querySelector('.exercise-main-card');
  const cardStepDuration = 1.24;
  const nextInAt = .88;
  const nextInDuration = .36;

  equipmentCards.forEach((card, i) => {
    const stepStart = i * cardStepDuration;
    stackTl.to({}, { duration:.30 }, stepStart);
    if (card === exerciseMainCard && exerciseCards.length) {
      stackTl.to(exerciseCards, {
        autoAlpha:1,
        y:0,
        scale:1,
        duration:.14,
        stagger:.11,
        ease:'power2.out'
      }, stepStart + .20);
    }
    stackTl.to({}, { duration:.40 }, stepStart + .30);
    stackTl.to({}, { duration:nextInAt - .70 }, stepStart + .70);
    if (i < equipmentCards.length - 1) {
      stackTl.to(equipmentCards[i + 1], { yPercent:0, duration:nextInDuration, ease:'none' }, stepStart + nextInAt);
      stackTl.to(card, { scale:.96, filter:'brightness(.7)', duration:nextInDuration, ease:'none' }, stepStart + nextInAt);
    } else {
      stackTl.to({}, { duration:nextInDuration }, stepStart + nextInAt);
    }
  });
}

const hyroxSection = document.querySelector('#hyrox');
const hyroxCards = hyroxSection ? gsap.utils.toArray('#hyrox .hst') : [];
if (hyroxSection && hyroxCards.length) {
  gsap.set(hyroxCards, { autoAlpha:0, y:70, scale:.96 });
  const hyroxTl = gsap.timeline({
    defaults:{ ease:'none' },
    scrollTrigger:{
      trigger:hyroxSection,
      start:'top top',
      end:() => '+=' + Math.max(2200, hyroxCards.length * getVH() * .65),
      pin:true,
      scrub:.6,
      anticipatePin:1,
      invalidateOnRefresh:true,
      markers:DEBUG_SCROLL
    }
  });
  hyroxTl.to({}, { duration:.25 });
  hyroxCards.forEach(card => {
    hyroxTl.to(card, { autoAlpha:1, y:0, scale:1, duration:.28 });
    hyroxTl.to({}, { duration:.22 });
  });
  hyroxTl.to({}, { duration:.35 });
}

const whyTickerMask = document.querySelector('.why-ticker-mask');
const whyTickerTrack = whyTickerMask ? whyTickerMask.querySelector('.why-ticker-track') : null;
const whyTickerSet = whyTickerMask ? whyTickerMask.querySelector('.why-ticker-set') : null;
const whyPills = whyTickerMask ? gsap.utils.toArray('.why-pill') : [];
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (whyTickerTrack && whyTickerSet) {
  const setWhyLoopDistance = () => {
    whyTickerTrack.style.setProperty('--why-loop-distance', `${whyTickerSet.offsetHeight}px`);
  };
  setWhyLoopDistance();
  window.addEventListener('resize', setWhyLoopDistance);
  window.addEventListener('load', setWhyLoopDistance);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(setWhyLoopDistance);
  }
}
if (whyTickerMask && whyPills.length && !reduceMotion) {
  const updateWhyWheel = () => {
    const maskRect = whyTickerMask.getBoundingClientRect();
    const center = maskRect.top + maskRect.height / 2;
    const range = Math.max(1, maskRect.height / 2);
    whyPills.forEach(pill => {
      const rect = pill.getBoundingClientRect();
      const pillCenter = rect.top + rect.height / 2;
      const distance = Math.min(1, Math.abs(pillCenter - center) / range);
      const focus = 1 - distance;
      const scale = 0.84 + focus * 0.18;
      const opacity = 0.38 + focus * 0.62;
      pill.style.transform = `translateZ(0) scale(${scale.toFixed(3)})`;
      pill.style.opacity = opacity.toFixed(3);
      pill.style.zIndex = String(Math.round(focus * 10));
    });
    requestAnimationFrame(updateWhyWheel);
  };
  updateWhyWheel();
}

/* EQUIPMENT PLAYER */
function makePlayer(opts) {
  const { canvasId, loaderId, lbarId, sceneId, paId, pbId, pcId, hintId, progId, frames, total } = opts;
  const cv  = document.getElementById(canvasId);
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
      if(ld===total){rdy=true;lo.classList.add('done');paint(cur);ScrollTrigger.refresh();}
      onLoad();
    };
    if (img.complete) done(); else { img.onload = done; img.onerror = done; }
  });
  function fd(p,i0,i1,o0,o1) {
    if(p<i0)return 0; if(p<i1)return(p-i0)/(i1-i0);
    if(o0===undefined)return 1; if(p<o0)return 1; if(p<o1)return 1-(p-o0)/(o1-o0); return 0;
  }
  if (isStackCard) {
    ScrollTrigger.create({
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
  } else {
    ScrollTrigger.create({
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
  }
  updateFromProgress(0);
  (function loop() { if((rdy||firstPainted)&&Math.abs(tgt-cur)>0.05){cur+=(tgt-cur)*.08;paint(cur);} requestAnimationFrame(loop); })();
}

makePlayer({ canvasId:'canvas-rower',  loaderId:'loader-rower',  lbarId:'lbar-rower',  sceneId:'eq-rower',  paId:'pa-rower',  pbId:'pb-rower',  pcId:'pc-rower',  hintId:'hint-rower',  progId:'prog-rower',  frames:ROWER_ACTIVE_FRAMES,  total:ROWER_TOTAL  });
makePlayer({ canvasId:'canvas-skierg', loaderId:'loader-skierg', lbarId:'lbar-skierg', sceneId:'eq-skierg', paId:'pa-skierg', pbId:'pb-skierg', pcId:'pc-skierg', hintId:'hint-skierg', progId:'prog-skierg', frames:SKIERG_ACTIVE_FRAMES, total:SKIERG_TOTAL });
if (bgVideo) bgVideo.addEventListener('loadedmetadata', () => ScrollTrigger.refresh(), { once:true });
window.addEventListener('load', () => ScrollTrigger.refresh());
