/* ═══════════════════════════════════════════════════════════════
   THE CODEX INGENIUM — Lock Screen & Page Script
   Pre-rendered ASCII video lock screen, mobile menu
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Lock Screen Interaction ───
  function initLockScreen() {
    const lock = document.getElementById('codex-lock');
    const content = document.getElementById('codex-page');
    if (!lock || !content) return;

    function unlockCodex() {
      lock.classList.add('unlocked');
      setTimeout(function () {
        lock.style.display = 'none';
        content.style.display = 'block';
        content.style.opacity = '0';
        requestAnimationFrame(function () {
          content.style.transition = 'opacity 0.8s ease';
          content.style.opacity = '1';
        });
        window.scrollTo(0, 0);
      }, 800); // match the CSS transition duration
    }

    // Enter key to proceed
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Enter') {
        document.removeEventListener('keydown', onKey);
        unlockCodex();
      }
    });

    // Tap/click anywhere to proceed on mobile
    lock.addEventListener('click', unlockCodex, { once: true });
  }

  // ─── Mobile Menu ───
  function initMobileMenu() {
    const hamburger = document.querySelector('.nav-hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileClose = document.querySelector('.mobile-menu-close');

    function openMenu() {
      if (!mobileMenu || !hamburger) return;
      mobileMenu.classList.add('open');
      mobileMenu.setAttribute('aria-hidden', 'false');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      if (!mobileMenu || !hamburger) return;
      mobileMenu.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    if (hamburger) hamburger.addEventListener('click', openMenu);
    if (mobileClose) mobileClose.addEventListener('click', closeMenu);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) {
        closeMenu();
        if (hamburger) hamburger.focus();
      }
    });
  }

  // ─── Init ───
  function init() {
    initLockScreen();
    initMobileMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
