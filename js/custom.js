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
    });
    collapseEl.addEventListener('hidden.bs.collapse', () => {
      collapseEl.classList.remove('closing');
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