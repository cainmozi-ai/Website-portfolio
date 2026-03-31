/* ═══════════════════════════════════════════════════════════════
   THE MORIARTY EXPERIENCE — UI Enhancements
   Lightbox, micro-interactions, parallax, cursor, text reveals
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // Respect reduced motion preference
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Image Lightbox ───
  // Click any gallery/project image to view fullscreen with zoom
  (function initLightbox() {
    var overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Image viewer');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<button class="lightbox-close" aria-label="Close image viewer">&times;</button>' +
      '<img class="lightbox-img" alt="" />' +
      '<div class="lightbox-caption"></div>';
    document.body.appendChild(overlay);

    var img = overlay.querySelector('.lightbox-img');
    var caption = overlay.querySelector('.lightbox-caption');
    var closeBtn = overlay.querySelector('.lightbox-close');

    function openLightbox(src, alt) {
      img.src = src;
      img.alt = alt || '';
      caption.textContent = alt || '';
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function closeLightbox() {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      img.src = '';
    }

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('active')) closeLightbox();
    });

    // Attach to gallery images and project hero images
    var selectors = [
      '.cs-gallery-item img',
      '.cs-gallery-hero img',
      '.cs-gallery-details img',
      '.cs-process-image img'
    ];
    var images = document.querySelectorAll(selectors.join(', '));
    images.forEach(function (imgEl) {
      imgEl.style.cursor = 'zoom-in';
      imgEl.setAttribute('tabindex', '0');
      imgEl.setAttribute('role', 'button');
      imgEl.setAttribute('aria-label', 'View full size: ' + (imgEl.alt || 'image'));
      imgEl.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        // Get the highest resolution source
        var src = imgEl.currentSrc || imgEl.src;
        openLightbox(src, imgEl.alt);
      });
      imgEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var src = imgEl.currentSrc || imgEl.src;
          openLightbox(src, imgEl.alt);
        }
      });
    });
  })();


  // ─── Hero Parallax Depth ───
  // Subtle parallax on the hero brandmark as user scrolls
  if (!prefersReducedMotion) {
    (function initHeroParallax() {
      var heroContent = document.querySelector('.hero-content');
      var hero = document.querySelector('.hero');
      if (!heroContent || !hero) return;

      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var scrollY = window.scrollY;
          var heroHeight = hero.offsetHeight;
          if (scrollY < heroHeight) {
            var ratio = scrollY / heroHeight;
            heroContent.style.transform = 'translateY(' + (ratio * 40) + 'px)';
            heroContent.style.opacity = 1 - (ratio * 0.6);
          }
          ticking = false;
        });
      }, { passive: true });
    })();
  }


  // ─── Magnetic CTA Buttons ───
  // CTAs subtly shift toward the cursor on hover
  if (!prefersReducedMotion) {
    (function initMagneticButtons() {
      var ctas = document.querySelectorAll('.project-cta, .contact-email');
      ctas.forEach(function (el) {
        el.addEventListener('mousemove', function (e) {
          var rect = el.getBoundingClientRect();
          var x = e.clientX - rect.left - rect.width / 2;
          var y = e.clientY - rect.top - rect.height / 2;
          el.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.15) + 'px)';
        });
        el.addEventListener('mouseleave', function () {
          el.style.transform = 'translate(0, 0)';
          el.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)';
          setTimeout(function () { el.style.transition = ''; }, 300);
        });
      });
    })();
  }


  // ─── Project Card Tilt ───
  // Subtle 3D tilt on project cards on hover
  if (!prefersReducedMotion) {
    (function initCardTilt() {
      var cards = document.querySelectorAll('.project-image-wrap');
      cards.forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
          var rect = card.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width - 0.5;
          var y = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transform = 'perspective(600px) rotateY(' + (x * 4) + 'deg) rotateX(' + (-y * 4) + 'deg) scale(1.01)';
        });
        card.addEventListener('mouseleave', function () {
          card.style.transform = '';
          card.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)';
          setTimeout(function () { card.style.transition = ''; }, 400);
        });
      });
    })();
  }


  // ─── Staggered Text Reveal ───
  // Section headings animate in letter by letter
  if (!prefersReducedMotion) {
    (function initTextReveal() {
      var headings = document.querySelectorAll('.section-label, .about-motto');
      headings.forEach(function (heading) {
        var text = heading.textContent;
        heading.innerHTML = '';
        heading.setAttribute('aria-label', text);
        for (var i = 0; i < text.length; i++) {
          var span = document.createElement('span');
          span.className = 'char-reveal';
          span.style.setProperty('--char-index', i);
          span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
          span.setAttribute('aria-hidden', 'true');
          heading.appendChild(span);
        }
      });

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('chars-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });

      headings.forEach(function (h) { observer.observe(h); });
    })();
  }


  // ─── Custom Cursor ───
  // Dot + ring cursor that reacts to interactive elements
  if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    (function initCustomCursor() {
      var dot = document.createElement('div');
      dot.className = 'cursor-dot';
      var ring = document.createElement('div');
      ring.className = 'cursor-ring';
      document.body.appendChild(dot);
      document.body.appendChild(ring);

      var mouseX = 0, mouseY = 0;
      var ringX = 0, ringY = 0;

      document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';
      });

      function animateRing() {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;
        ring.style.left = ringX + 'px';
        ring.style.top = ringY + 'px';
        requestAnimationFrame(animateRing);
      }
      animateRing();

      // Expand on interactive elements
      var interactives = 'a, button, .project-image-wrap, .project-cta, input, textarea';
      document.addEventListener('mouseover', function (e) {
        if (e.target.closest(interactives)) {
          ring.classList.add('cursor-hover');
          dot.classList.add('cursor-hover');
        }
      });
      document.addEventListener('mouseout', function (e) {
        if (e.target.closest(interactives)) {
          ring.classList.remove('cursor-hover');
          dot.classList.remove('cursor-hover');
        }
      });
    })();
  }


  // ─── Scroll-Triggered Counter for Process Numbers ───
  // Process numbers count up from 0 when they enter the viewport
  if (!prefersReducedMotion) {
    (function initCountUp() {
      var nums = document.querySelectorAll('.cs-process-num');
      if (!nums.length) return;

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var target = el.textContent.trim();
            var numMatch = target.match(/\d+/);
            if (!numMatch) return;
            var end = parseInt(numMatch[0], 10);
            var prefix = target.replace(/\d+/, '');
            var start = 0;
            var duration = 600;
            var startTime = null;

            function step(timestamp) {
              if (!startTime) startTime = timestamp;
              var progress = Math.min((timestamp - startTime) / duration, 1);
              var eased = 1 - Math.pow(1 - progress, 3);
              var current = Math.round(eased * end);
              el.textContent = prefix.replace(/\d+/, '') + (current < 10 ? '0' : '') + current;
              if (progress < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
            observer.unobserve(el);
          }
        });
      }, { threshold: 0.5 });

      nums.forEach(function (n) { observer.observe(n); });
    })();
  }


  // ─── Smooth Scroll Indicator (Mouse Icon) ───
  // Replace the line with an animated mouse icon
  (function initScrollIcon() {
    var indicator = document.querySelector('.scroll-indicator');
    if (!indicator) return;

    var line = indicator.querySelector('.scroll-line');
    if (line) line.style.display = 'none';

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 40');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '40');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.5');
    svg.classList.add('scroll-mouse-icon');
    svg.innerHTML =
      '<rect x="1" y="1" width="22" height="38" rx="11" />' +
      '<line class="scroll-mouse-wheel" x1="12" y1="8" x2="12" y2="16" stroke-linecap="round" />';
    indicator.appendChild(svg);
  })();

})();
