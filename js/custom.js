
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
    const fullWidth = track.scrollWidth;
    if(!fullWidth) return;
    const halfWidth = fullWidth / 2;
    track.style.setProperty('--marquee-shift', `${-halfWidth}px`);
  };

  const init = () => {
    computeShift();
  };
  if(document.readyState === 'complete') init();
  else window.addEventListener('load', init, { once: true });
  window.addEventListener('resize', computeShift);
  window.addEventListener('orientationchange', computeShift);
})();

// ---------- Main dropdown navigation logic ----------
document.addEventListener('DOMContentLoaded', function () {
  const mqDesktop = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1200px)');

  function show(li) {
    const toggle = li.querySelector(':scope > .dropdown-toggle');
    const menu   = li.querySelector(':scope > .dropdown-menu');
    if (!toggle || !menu) return;
    // close open siblings at the same level
    const sibs = li.parentElement?.querySelectorAll(':scope > .dropdown.show, :scope > .dropend.show, :scope > li.show');
    sibs && sibs.forEach(s => { if (s !== li) hide(s); });
    li.classList.add('show');
    toggle.setAttribute('aria-expanded', 'true');
    menu.classList.add('show');
  }
  
  function hide(li) {
    const toggle = li.querySelector(':scope > .dropdown-toggle');
    const menu   = li.querySelector(':scope > .dropdown-menu');
    if (!toggle || !menu) return;
    // Also hide any open children
    const children = li.querySelectorAll('.dropdown.show, .dropend.show, li.show');
    children.forEach(child => hide(child));
    li.classList.remove('show');
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('show');
  }
  
  function withLeaveDelay(li, fn) {
    clearTimeout(li._hoverTimer);
    li._hoverTimer = setTimeout(fn, 160);
  }
  
  function bindHover() {
    // Select ALL dropdowns and dropends, including nested ones
    document.querySelectorAll('.main-navbar .dropdown, .main-navbar .dropend').forEach(li => {
      li.addEventListener('mouseenter', () => { 
        clearTimeout(li._hoverTimer); 
        show(li); 
      });
      li.addEventListener('mouseleave', () => withLeaveDelay(li, () => hide(li)));
      li.addEventListener('focusin',  () => show(li));
      li.addEventListener('focusout', (e) => { 
        if (!li.contains(e.relatedTarget)) hide(li); 
      });
    });

    // ESC closes all
    document.addEventListener('keydown', onEscClose);
  }
  
  function unbindHover() {
    document.querySelectorAll('.main-navbar .dropdown.show, .main-navbar .dropend.show, .main-navbar li.show').forEach(hide);
    document.removeEventListener('keydown', onEscClose);
  }
  
  function onEscClose(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.main-navbar .dropdown.show, .main-navbar .dropend.show, .main-navbar li.show').forEach(hide);
    }
  }

  // -------- Click handling (mobile & accessibility) --------
  function getToggleAnchorFromEvent(e) {
    let el = e.target;
    if (el && el.nodeType !== 1) el = el.parentElement;
    return el ? el.closest('.main-navbar a.dropdown-toggle') : null;
  }

  function findSubmenuElementsFromToggle(a){
    // Works for .dropend structure and generic li > a + .dropdown-menu
    const li = a.closest('.dropend, .dropdown, li') || a.parentElement;
    const menu = a.nextElementSibling && a.nextElementSibling.classList.contains('dropdown-menu')
      ? a.nextElementSibling
      : li ? li.querySelector(':scope > .dropdown-menu') : null;
    return { li, menu };
  }
  
  function onToggleClick(e) {
    const a = getToggleAnchorFromEvent(e);
    if (!a) return;

    // allow new-tab / modified clicks
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;

    const href = a.getAttribute('href') || '';
    const isDesktop = mqDesktop.matches;
    const insideDropdownMenu = !!a.closest('.dropdown-menu'); // robust nested check

    if (isDesktop) {
      // Desktop: hover handles opening; click should navigate if it has an URL
      if (!href || href === '#' || href.startsWith('javascript:')) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      window.location.assign(href);
      return;
    }

    // ---- MOBILE BEHAVIOR ----
    if (insideDropdownMenu) {
      // Nested submenu toggle
      e.preventDefault();
      e.stopPropagation();

      const { li, menu } = findSubmenuElementsFromToggle(a);
      if (!li || !menu) return;

      // Close open siblings at the same level
      const containerMenu = li.parentElement; // UL.dropdown-menu
      if (containerMenu) {
        containerMenu.querySelectorAll(':scope > .dropend.show, :scope > li.show').forEach(sib => {
          if (sib !== li) {
            const sibToggle = sib.querySelector(':scope > .dropdown-toggle');
            const sibMenu   = sib.querySelector(':scope > .dropdown-menu');
            sib.classList.remove('show');
            if (sibToggle) sibToggle.setAttribute('aria-expanded', 'false');
            if (sibMenu)   sibMenu.classList.remove('show');
          }
        });
      }

      // Toggle current submenu
      const isOpen = li.classList.contains('show');
      if (isOpen) {
        li.classList.remove('show');
        a.setAttribute('aria-expanded', 'false');
        menu.classList.remove('show');
      } else {
        li.classList.add('show');
        a.setAttribute('aria-expanded', 'true');
        menu.classList.add('show');
      }
      return;
    } else {
      // Top-level dropdown in hamburger: let Bootstrap manage open/close,
      // but prevent immediate navigation when it's already open (second tap should navigate).
      if (href && href !== '#' && !href.startsWith('javascript:')) {
        const expanded  = a.getAttribute('aria-expanded') === 'true';
        if (expanded) {
          // Already open -> prevent navigation on the same tap
          e.preventDefault();
        } // else allow Bootstrap to open it
      } else {
        // No real URL: just let Bootstrap toggle it
      }
    }
  }
  
  // Capture phase so we run before Bootstrap prevents default
  document.addEventListener('click', function (e) {
    const a = getToggleAnchorFromEvent(e);
    if (a) onToggleClick(e);
  }, true);

  // Disable Bootstrap's click toggle on desktop; restore on mobile
  function applyToggleAttrPolicy() {
    document.querySelectorAll('.main-navbar a.dropdown-toggle').forEach(a => {
      if (mqDesktop.matches) {
        if (!a.hasAttribute('data-original-toggle')) {
          a.setAttribute('data-original-toggle', a.getAttribute('data-bs-toggle') || 'dropdown');
          a.setAttribute('data-original-autoclose', a.getAttribute('data-bs-auto-close') || '');
        }
        a.removeAttribute('data-bs-toggle');
        a.removeAttribute('data-bs-auto-close');
      } else {
        const t  = a.getAttribute('data-original-toggle') || 'dropdown';
        const ac = a.getAttribute('data-original-autoclose');
        a.setAttribute('data-bs-toggle', t);
        if (ac) a.setAttribute('data-bs-auto-close', ac);
        else a.removeAttribute('data-bs-auto-close');
      }
    });
  }

  function applyMode() {
    if (mqDesktop.matches) {
      applyToggleAttrPolicy();
      bindHover();
    } else {
      unbindHover();
      applyToggleAttrPolicy();
    }
  }

  applyMode();
  mqDesktop.addEventListener('change', applyMode);
});
