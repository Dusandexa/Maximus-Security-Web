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
      // The markup duplicates the logos once; shift should equal width of the first half
      // We take half of the track children as the first set
      const items = Array.from(track.children);
      if(items.length < 2) return;
      const half = Math.floor(items.length / 2);
      let shift = 0;
      for(let i=0;i<half;i++){
        shift += items[i].getBoundingClientRect().width;
      }
      // Include margins via computed style
      // getBoundingClientRect already includes margins in layout? It doesn't, so add horizontal margins
      // Sum margins explicitly
      for(let i=0;i<half;i++){
        const cs = getComputedStyle(items[i]);
        shift += parseFloat(cs.marginLeft) + parseFloat(cs.marginRight);
      }
  // Preserve subpixel precision for perfectly seamless loop; add tiny epsilon to avoid subpixel accumulation issues
  const epsilon = 0.0001;
  track.style.setProperty('--marquee-shift', `${-(shift + epsilon)}px`);
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
