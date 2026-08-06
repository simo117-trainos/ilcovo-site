(() => {
  const nav = document.getElementById('nav');
  const darkSections = document.querySelectorAll('[data-cf-dark]');
  const setNavTheme = () => {
    const y = 72;
    const overDark = [...darkSections].some(section => {
      const rect = section.getBoundingClientRect();
      return rect.top <= y && rect.bottom >= y;
    });
    nav.classList.toggle('cf-nav--dark', overDark);
    nav.classList.toggle('cf-nav--light', !overDark);
    nav.classList.toggle('solid', window.scrollY > 30);
  };
  window.addEventListener('scroll', setNavTheme, { passive:true });
  setNavTheme();

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const story = document.querySelector('.cf-photo-story');
  const viewport = document.querySelector('.cf-photo-viewport');
  const track = document.querySelector('.cf-photo-track');
  const programPanels = track ? [...track.querySelectorAll('.cf-photo-panel')] : [];
  if (!reduced && story && viewport && track && programPanels.length && window.gsap) {
    const originalPanels = [...programPanels];
    let programCarouselTween;
    let resizeTimer;

    const removeClones = () => {
      track.querySelectorAll('[data-cf-program-clone]').forEach(clone => clone.remove());
    };

    const buildProgramCarousel = () => {
      programCarouselTween?.kill();
      programCarouselTween = null;
      removeClones();
      gsap.set(track, { x:0 });

      const trackStyles = getComputedStyle(track);
      const gap = parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;
      const sequenceWidth = originalPanels.reduce((total, panel) => total + panel.getBoundingClientRect().width, 0) + gap * Math.max(0, originalPanels.length - 1);
      if (sequenceWidth <= 0) return;

      originalPanels.forEach(panel => {
        const clone = panel.cloneNode(true);
        clone.dataset.cfProgramClone = '';
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });

      const duration = Math.max(22, sequenceWidth / 100);
      programCarouselTween = gsap.to(track, {
        x: -(sequenceWidth + gap),
        duration,
        ease:'none',
        repeat:-1
      });
    };

    const slowProgramCarousel = () => programCarouselTween?.timeScale(.25);
    const resumeProgramCarousel = () => programCarouselTween?.timeScale(1);

    viewport.addEventListener('mouseenter', slowProgramCarousel);
    viewport.addEventListener('mouseleave', resumeProgramCarousel);
    viewport.addEventListener('focusin', slowProgramCarousel);
    viewport.addEventListener('focusout', resumeProgramCarousel);

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildProgramCarousel, 180);
    });

    if (document.readyState === 'complete') buildProgramCarousel();
    else window.addEventListener('load', buildProgramCarousel, { once:true });
    buildProgramCarousel();
  }
  const testimonialTrack = document.querySelector('.cf-testimonial-track');
  const cards = testimonialTrack ? [...testimonialTrack.children] : [];
  const count = document.querySelector('[data-cf-count]');
  let index = 0;
  const updateTestimonial = next => {
    if (!cards.length) return;
    index = (next + cards.length) % cards.length;
    testimonialTrack.style.transform = `translateX(-${index * 100}%)`;
    count.textContent = `${String(index + 1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;
  };
  document.querySelector('[data-cf-prev]')?.addEventListener('click', () => updateTestimonial(index - 1));
  document.querySelector('[data-cf-next]')?.addEventListener('click', () => updateTestimonial(index + 1));
})();
