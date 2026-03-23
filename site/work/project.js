/* ═══════════════════════════════════════════════════════════════
   THE MORIARTY EXPERIENCE — Project Page Script
   Handles: always-visible nav, scroll progress, reveal animations
   Mobile menu + CODEX sequence handled by shared.js
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const nav = document.querySelector('.nav');
  const scrollProgress = document.querySelector('.scroll-progress');

  // Nav is always visible on project pages (no hero to hide it)
  if (nav) nav.classList.add('visible');

  // ─── Scroll Progress Bar ───
  function updateScrollProgress() {
    if (!scrollProgress) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.transform = 'scaleX(' + (progress / 100) + ')';
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
  setupRevealObserver();
  updateScrollProgress();
})();
