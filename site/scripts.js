/* ═══════════════════════════════════════════════════════════════
   THE MORIARTY EXPERIENCE — Portfolio Script
   Vanilla JS: Intersection Observer, scroll handling, mobile menu
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── DOM References ───
  const nav = document.querySelector('.nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileClose = document.querySelector('.mobile-menu-close');
  const mobileLinks = document.querySelectorAll('.mobile-menu-link');
  const scrollIndicator = document.querySelector('.scroll-indicator');
  const scrollProgress = document.querySelector('.scroll-progress');
  const heroSection = document.getElementById('hero');

  // ─── State ───
  let activeSection = 'hero';
  let ticking = false;

  // ─── Navigation: Show/Hide on Scroll ───
  // Nav is hidden while hero is in view, appears after scrolling past hero
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
        rootMargin: '-40% 0px -55% 0px', // Middle 5% of viewport triggers
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

    let revealDelay = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger reveals that enter simultaneously
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
      card.dataset.revealDelay = (i % 2) * 100; // Stagger pairs
    });

    revealElements.forEach((el) => observer.observe(el));
  }

  // ─── Scroll Progress Bar ───
  function updateScrollProgress() {
    if (!scrollProgress) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = progress + '%';
  }

  // ─── Scroll Indicator Fade ───
  function updateScrollIndicator() {
    if (!scrollIndicator) return;
    const opacity = Math.max(0, 1 - window.scrollY / 300);
    scrollIndicator.style.opacity = opacity;
    if (opacity <= 0) {
      scrollIndicator.style.visibility = 'hidden';
    } else {
      scrollIndicator.style.visibility = 'visible';
    }
  }

  // ─── Unified Scroll Handler ───
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateNavVisibility();
        updateScrollProgress();
        updateScrollIndicator();
        ticking = false;
      });
      ticking = true;
    }
  }

  // ─── Mobile Menu ───
  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  // ─── Smooth Scroll for Nav Links ───
  function handleNavClick(e) {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
    // Close mobile menu if open
    closeMobileMenu();
  }

  // ─── Keyboard Accessibility for Mobile Menu ───
  function handleKeyDown(e) {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) {
      closeMobileMenu();
      hamburger.focus();
    }
  }

  // ─── Initialization ───
  function init() {
    // Scroll listeners
    window.addEventListener('scroll', onScroll, { passive: true });

    // Nav click handlers
    navLinks.forEach((link) => link.addEventListener('click', handleNavClick));
    mobileLinks.forEach((link) => link.addEventListener('click', handleNavClick));

    // Nav brand click
    const navBrand = document.querySelector('.nav-brand');
    if (navBrand) {
      navBrand.addEventListener('click', handleNavClick);
    }

    // Mobile menu
    if (hamburger) hamburger.addEventListener('click', openMobileMenu);
    if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu);

    // Keyboard
    document.addEventListener('keydown', handleKeyDown);

    // Setup observers
    setupSectionObserver();
    setupRevealObserver();

    // Initial state
    updateNavVisibility();
    updateScrollProgress();
    updateScrollIndicator();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
