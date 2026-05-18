const IS_MOBILE = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
const ROWER_ACTIVE_FRAMES = IS_MOBILE ? ROWER_FRAMES_MOBILE : ROWER_FRAMES_DESKTOP;
const SKIERG_ACTIVE_FRAMES = IS_MOBILE ? SKIERG_FRAMES_MOBILE : SKIERG_FRAMES_DESKTOP;
const ROWER_TOTAL  = ROWER_ACTIVE_FRAMES.length;
const SKIERG_TOTAL = SKIERG_ACTIVE_FRAMES.length;
const TOTAL_ASSETS = ROWER_TOTAL + SKIERG_TOTAL;
const getVH = () => (window.visualViewport && window.visualViewport.height) || window.innerHeight;
const getScrollTop = () => document.documentElement.scrollTop || window.scrollY || 0;
const DEBUG_SCROLL = false;

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
  const ctaPanel = document.getElementById('cta-panel');
  const ctaBtns = document.getElementById('cta-btns');
  const ctaSub = document.getElementById('cta-sub');
  const shint = document.getElementById('shint');
  const iprog = document.getElementById('iprog');
  const starts = isMobile ? [.18,.32,.46,.60,.74] : [.18,.33,.48,.63,.77];
  const span = isMobile ? .145 : .155;

  gsap.set([bgVideo, bgOverlay, ctaPanel, ctaBtns, ctaSub], { autoAlpha:0 });
  gsap.set('#wolf-layer', { autoAlpha:1, scale:1 });
  gsap.set(phrases, { autoAlpha:0 });
  gsap.set('.phrase .li', { yPercent:105 });

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
      markers:DEBUG_SCROLL,
      onUpdate:self => {
        iprog.style.width = (self.progress * 100) + '%';
        if (shint) shint.style.opacity = Math.max(0, 1 - self.progress * 8);
        if (DEBUG_SCROLL) console.log('intro', self.progress.toFixed(3));
      }
    }
  });

  tl.to({}, { duration:1 });
  tl.to('#wolf-layer', { autoAlpha:0, scale:isMobile ? .9 : .92, duration:.16 }, 0);
  tl.to(bgVideo, { autoAlpha:1, duration:.14 }, .10);
  tl.to(bgOverlay, { autoAlpha:1, duration:.14 }, .10);

  phrases.forEach((el, i) => {
    const lines = el.querySelectorAll('.li');
    const start = starts[i];
    const end = start + span;
    tl.to(el, { autoAlpha:1, duration:.035 }, start);
    tl.to(lines, { yPercent:0, duration:.055, stagger:.012, ease:'power3.out' }, start + .015);
    tl.to(el, { autoAlpha:0, duration:.04 }, end);
    tl.to(lines, { yPercent:-105, duration:.04, stagger:.008, ease:'power2.in' }, end - .025);
  });

  tl.to(ctaPanel, { autoAlpha:1, duration:.08 }, isMobile ? .90 : .91);
  tl.to(ctaBtns, { autoAlpha:1, duration:.06 }, isMobile ? .93 : .94);
  tl.to(ctaSub, { autoAlpha:1, duration:.06 }, isMobile ? .95 : .96);
}

const scrollMM = gsap.matchMedia();
scrollMM.add({
  desktop:'(min-width: 768px)',
  mobile:'(max-width: 767px)'
}, ctx => {
  makeIntroTimeline(ctx.conditions.mobile);
});

/* EQUIPMENT PLAYER */
function makePlayer(opts) {
  const { canvasId, loaderId, lbarId, sceneId, paId, pbId, pcId, hintId, progId, frames, total } = opts;
  const cv  = document.getElementById(canvasId);
  const ctx = cv.getContext('2d', { alpha:false });
  const lo  = document.getElementById(loaderId);
  const lb2 = document.getElementById(lbarId);
  const scene = document.getElementById(sceneId);
  const pin = scene.querySelector('.eq-pin');
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
    if(pa){const op=fd(p,0,.05,.28,.44);pa.style.opacity=op;pa.style.transform='translateY('+(p<.28?0:-(1-op)*40)+'px)';}
    if(pb){const op=fd(p,.38,.52,.62,.76);pb.style.opacity=op;pb.style.transform='translateY('+(p<.45?Math.max(0,24*(1-(p-.38)/.14)):0)+'px)';}
    if(pc){const op=fd(p,.72,.86);pc.style.opacity=op;pc.style.transform='translateY('+(p<.86?Math.max(0,24*(1-(p-.72)/.14)):0)+'px)';}
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
  updateFromProgress(0);
  (function loop() { if((rdy||firstPainted)&&Math.abs(tgt-cur)>0.05){cur+=(tgt-cur)*.08;paint(cur);} requestAnimationFrame(loop); })();
}

makePlayer({ canvasId:'canvas-rower',  loaderId:'loader-rower',  lbarId:'lbar-rower',  sceneId:'eq-rower',  paId:'pa-rower',  pbId:'pb-rower',  pcId:'pc-rower',  hintId:'hint-rower',  progId:'prog-rower',  frames:ROWER_ACTIVE_FRAMES,  total:ROWER_TOTAL  });
makePlayer({ canvasId:'canvas-skierg', loaderId:'loader-skierg', lbarId:'lbar-skierg', sceneId:'eq-skierg', paId:'pa-skierg', pbId:'pb-skierg', pcId:'pc-skierg', hintId:'hint-skierg', progId:'prog-skierg', frames:SKIERG_ACTIVE_FRAMES, total:SKIERG_TOTAL });
if (bgVideo) bgVideo.addEventListener('loadedmetadata', () => ScrollTrigger.refresh(), { once:true });
window.addEventListener('load', () => ScrollTrigger.refresh());
