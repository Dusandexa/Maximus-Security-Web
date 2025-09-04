 // Restore scroll-based blur
  (function(){
    const nav = document.querySelector('.main-navbar');
    const onScroll = () => {
      if(window.scrollY > 10){ nav.classList.add('scrolled'); }
      else{ nav.classList.remove('scrolled'); }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
  })();

  // Speed up closing animation by toggling a 'closing' class
  (function(){
    const collapseEl = document.getElementById('mainNav');
    if(!collapseEl) return;
    collapseEl.addEventListener('hide.bs.collapse', () => {
      collapseEl.classList.add('closing');
      document.body.classList.remove('nav-open');
    });
    collapseEl.addEventListener('hidden.bs.collapse', () => {
      collapseEl.classList.remove('closing');
    });
    collapseEl.addEventListener('show.bs.collapse', () => {
      document.body.classList.add('nav-open');
    });
    collapseEl.addEventListener('shown.bs.collapse', () => {
      document.body.classList.add('nav-open');
    });
  })();

  // Ensure dropdown toggle loses focus after closing to revert color immediately
  (function(){
    document.addEventListener('hidden.bs.dropdown', function(){
      const el = document.activeElement;
      if (el && el.classList && el.classList.contains('dropdown-toggle')) {
        el.blur();
      }
    });
  })();
  
  // Marquee: compute exact shift so mobile doesn't stutter/reset
  (function(){
    const slider = document.querySelector('.slider');
    const track  = document.querySelector('.logos');
    if(!slider || !track) return;

    const computeShift = () => {
      // Duplicate content is appended once; the shift equals exactly half the full track width
      // Using scrollWidth captures the true layout width with margins inside flex
      const fullWidth = track.scrollWidth; // width of both sets together
      if(!fullWidth) return;
      const halfWidth = fullWidth / 2;
      track.style.setProperty('--marquee-shift', `${-halfWidth}px`);
    };

    // Run after images load; recalculates on resize/orientation changes
    const init = () => {
      computeShift();
    };
    if(document.readyState === 'complete') init();
    else window.addEventListener('load', init, { once: true });
    window.addEventListener('resize', computeShift);
    window.addEventListener('orientationchange', computeShift);
  })();
