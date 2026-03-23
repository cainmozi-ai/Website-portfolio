/* ═══════════════════════════════════════════════════════════════
   THE MORIARTY EXPERIENCE — Shared Utilities
   Mobile menu (with focus trap), CODEX keyboard sequence
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Mobile Menu ───
  var hamburger = document.querySelector('.nav-hamburger');
  var mobileMenu = document.querySelector('.mobile-menu');
  var mobileClose = document.querySelector('.mobile-menu-close');

  function openMobileMenu() {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var firstFocusable = mobileMenu.querySelector('button, a');
    if (firstFocusable) firstFocusable.focus();
  }

  function closeMobileMenu() {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function trapFocus(e) {
    if (!mobileMenu || !mobileMenu.classList.contains('open')) return;
    var focusable = mobileMenu.querySelectorAll('button, a[href]');
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (hamburger) hamburger.addEventListener('click', openMobileMenu);
  if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) {
      closeMobileMenu();
      if (hamburger) hamburger.focus();
    }
    if (e.key === 'Tab') trapFocus(e);
  });

  // Expose for other scripts that need to close the menu
  window.__closeMobileMenu = closeMobileMenu;

  // ─── Blur-Up Placeholders ───
  // Elements with class .blur-placeholder crossfade from base64 background to loaded image
  var blurEls = document.querySelectorAll('.blur-placeholder');
  blurEls.forEach(function (el) {
    var img = el.querySelector('img');
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      el.classList.add('loaded');
    } else {
      img.addEventListener('load', function () {
        el.classList.add('loaded');
      });
    }
  });

  // ─── CODEX Keyboard Sequence ───
  // Typing C-O-D-E-X navigates to the hidden Codex page
  (function () {
    var sequence = 'codex';
    var buffer = '';
    var timeout;
    var isProjectPage = window.location.pathname.indexOf('/work/') !== -1;
    var codexPath = isProjectPage ? '../codex.html' : 'codex.html';

    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      buffer += e.key.toLowerCase();
      clearTimeout(timeout);
      timeout = setTimeout(function () { buffer = ''; }, 2000);
      if (buffer.length > sequence.length) {
        buffer = buffer.slice(-sequence.length);
      }
      if (buffer === sequence) {
        buffer = '';
        window.location.href = codexPath;
      }
    });
  })();
})();
