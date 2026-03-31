/* ═══════════════════════════════════════════════════════════════
   THE MORIARTY EXPERIENCE — Portfolio Script
   Vanilla JS: Intersection Observer, scroll handling, smooth nav
   Mobile menu + CODEX sequence handled by shared.js
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── DOM References ───
  const nav = document.querySelector('.nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const mobileLinks = document.querySelectorAll('.mobile-menu-link');
  const scrollProgress = document.querySelector('.scroll-progress');
  const heroSection = document.getElementById('hero');

  // ─── State ───
  let activeSection = 'hero';
  let ticking = false;

  // ─── Navigation: Show/Hide on Scroll ───
  function updateNavVisibility() {
    if (!heroSection || !nav) return;
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    if (heroBottom <= 0) {
      nav.classList.add('visible');
    } else {
      nav.classList.remove('visible');
    }
  }

  // ─── Active Section Detection (Intersection Observer) ───
  function setupSectionObserver() {
    const sections = document.querySelectorAll('section[id]');
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id !== activeSection) {
              activeSection = id;
              updateActiveNav(id);
            }
          }
        });
      },
      {
        rootMargin: '-40% 0px -55% 0px',
        threshold: 0,
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function updateActiveNav(sectionId) {
    navLinks.forEach((link) => {
      const linkSection = link.getAttribute('data-section');
      if (linkSection === sectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // ─── Scroll-Triggered Reveals (Intersection Observer) ───
  function setupRevealObserver() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (!revealElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = parseFloat(el.dataset.revealDelay) || 0;
            setTimeout(() => {
              el.classList.add('revealed');
            }, delay);
            observer.unobserve(el);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    // Assign stagger delays to grid children
    const gridCards = document.querySelectorAll('.project-grid .reveal-on-scroll');
    gridCards.forEach((card, i) => {
      card.dataset.revealDelay = (i % 2) * 100;
    });

    revealElements.forEach((el) => observer.observe(el));
  }

  // ─── Scroll Progress Bar ───
  function updateScrollProgress() {
    if (!scrollProgress) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.transform = 'scaleX(' + (progress / 100) + ')';
  }

  // ─── Unified Scroll Handler ───
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateNavVisibility();
        updateScrollProgress();
        ticking = false;
      });
      ticking = true;
    }
  }

  // ─── Smooth Scroll for Nav Links ───
  function handleNavClick(e) {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
    if (window.__closeMobileMenu) window.__closeMobileMenu();
  }

  // ─── Initialization ───
  function init() {
    window.addEventListener('scroll', onScroll, { passive: true });

    navLinks.forEach((link) => link.addEventListener('click', handleNavClick));
    mobileLinks.forEach((link) => link.addEventListener('click', handleNavClick));

    const navBrand = document.querySelector('.nav-brand');
    if (navBrand) navBrand.addEventListener('click', handleNavClick);

    setupSectionObserver();
    setupRevealObserver();

    updateNavVisibility();
    updateScrollProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
