/* ═══════════════════════════════════════════════════════════════
   THE CODEX INGENIUM — Lock Screen & Page Script
   Pre-rendered ASCII video lock screen
   Mobile menu handled by shared.js
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
      }, 800);
    }

    // Auto-focus the enter button
    var enterBtn = document.getElementById('codex-enter');
    if (enterBtn) enterBtn.focus();

    // Enter key to proceed
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Enter') {
        document.removeEventListener('keydown', onKey);
        unlockCodex();
      }
    });

    // Button click or tap anywhere to proceed
    if (enterBtn) enterBtn.addEventListener('click', unlockCodex, { once: true });
    lock.addEventListener('click', unlockCodex, { once: true });
  }

  // ─── Init ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLockScreen);
  } else {
    initLockScreen();
  }
})();
