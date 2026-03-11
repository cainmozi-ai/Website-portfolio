/* ═══════════════════════════════════════════════════════════════
   THE MORIARTY EXPERIENCE — Project Page Script
   Handles: always-visible nav, scroll progress, reveal animations, mobile menu
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const nav = document.querySelector('.nav');
  const scrollProgress = document.querySelector('.scroll-progress');
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileClose = document.querySelector('.mobile-menu-close');

  // Nav is always visible on project pages (no hero to hide it)
  if (nav) nav.classList.add('visible');

  // ─── Scroll Progress Bar ───
  function updateScrollProgress() {
    if (!scrollProgress) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = progress + '%';
  }

  // ─── Scroll-Triggered Reveals ───
  function setupRevealObserver() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (!revealElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach((el) => observer.observe(el));
  }

  // ─── Mobile Menu ───
  function openMobileMenu() {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) {
      closeMobileMenu();
      if (hamburger) hamburger.focus();
    }
  });

  // ─── Scroll Handler ───
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateScrollProgress();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // ─── Init ───
  if (hamburger) hamburger.addEventListener('click', openMobileMenu);
  if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu);

  setupRevealObserver();
  updateScrollProgress();

  // CODEX keyboard sequence — typing C-O-D-E-X navigates to hidden page
  (function () {
    var sequence = 'codex';
    var buffer = '';
    var timeout;
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
        window.location.href = '../codex.html';
      }
    });
  })();
})();
