/* ═══════════════════════════════════════════════════════════════
   THE MORIARTY EXPERIENCE — Accessibility menu
   Visitor-controlled display settings. Each setting is applied as a
   class on <html>; the effects live in styles.css ("Accessibility menu").
   Settings are remembered per device (localStorage, always try/catch).
   Loaded in <head> so saved settings apply before first paint.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var STORE_KEY = 'tme-a11y';
  var root = document.documentElement;

  // Highest valid step per setting; 0 is always "off".
  var MAX = {
    contrast: 3, links: 1, text: 3, spacing: 3, pause: 1,
    images: 1, dyslexia: 1, lineheight: 3, align: 3, saturation: 3, pos: 2
  };
  var KEYS = Object.keys(MAX);

  // Tiles shown in the panel. `steps` are the labels for step 1..n.
  var TILES = [
    { key: 'contrast', label: 'Contrast', icon: '◐', steps: ['Invert Colors', 'Light Contrast', 'Dark Contrast'] },
    { key: 'links', label: 'Highlight Links', icon: '<u>ab</u>', steps: ['On'] },
    { key: 'text', label: 'Bigger Text', icon: 'A+', steps: ['110%', '125%', '150%'] },
    { key: 'spacing', label: 'Text Spacing', icon: '↔', steps: ['Light', 'Medium', 'Wide'] },
    { key: 'pause', label: 'Pause Animations', icon: '⏸', steps: ['On'] },
    { key: 'images', label: 'Hide Images', icon: '▣', steps: ['On'] },
    { key: 'dyslexia', label: 'Dyslexia Friendly', icon: 'Df', steps: ['On'] },
    { key: 'lineheight', label: 'Line Height', icon: '↕', steps: ['1.5x', '1.75x', '2x'] },
    { key: 'align', label: 'Text Align', icon: '≡', steps: ['Left', 'Centre', 'Right'] },
    { key: 'saturation', label: 'Saturation', icon: '◍', steps: ['Low', 'High', 'Greyscale'] }
  ];

  // ─── State ───
  function defaults() {
    var s = {};
    KEYS.forEach(function (k) { s[k] = 0; });
    return s;
  }

  function valid(key, value) {
    return MAX.hasOwnProperty(key) && typeof value === 'number' &&
      value % 1 === 0 && value >= 0 && value <= MAX[key];
  }

  function osPause() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0;
  }

  // True once the visitor has set Pause themselves; until then it follows the OS and is not saved.
  var pauseChosen = false;

  function load() {
    var s = defaults();
    var savedPause = false;
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      var saved = raw ? JSON.parse(raw) : null;
      if (saved && typeof saved === 'object') {
        KEYS.forEach(function (k) { if (valid(k, saved[k])) s[k] = saved[k]; });
        savedPause = valid('pause', saved.pause);
      }
    } catch (e) { /* storage blocked or corrupt: use defaults */ }
    // No saved choice: follow the OS "reduce motion" preference.
    pauseChosen = savedPause;
    if (!savedPause) s.pause = osPause();
    return s;
  }

  function save() {
    var out = copy();
    if (!pauseChosen) delete out.pause;
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(out)); } catch (e) { /* ignore */ }
  }

  var state = load();

  // ─── Apply to <html> ───
  var STEPPED = ['contrast', 'text', 'spacing', 'lineheight', 'align', 'saturation'];

  function applyClasses() {
    Array.prototype.slice.call(root.classList).forEach(function (c) {
      if (c.indexOf('a11y-') === 0) root.classList.remove(c);
    });
    STEPPED.forEach(function (k) {
      if (state[k]) root.classList.add('a11y-' + k + '-' + state[k]);
    });
    if (state.links) root.classList.add('a11y-links');
    if (state.pause) root.classList.add('a11y-pause');
    if (state.images) root.classList.add('a11y-images-off');
    if (state.dyslexia) root.classList.add('a11y-dyslexia');
    root.setAttribute('data-a11y-pos', String(state.pos));
  }

  applyClasses();

  // Pause Animations: stop any video that is playing and stop new ones autoplaying.
  function applyMotion() {
    if (!state.pause) return;
    Array.prototype.forEach.call(document.querySelectorAll('video'), function (v) {
      v.removeAttribute('autoplay');
      if (!v.paused) v.pause();
    });
  }

  function changed() {
    applyClasses();
    applyMotion();
    save();
    render();
    document.dispatchEvent(new CustomEvent('a11y:change', { detail: copy() }));
  }

  function copy() {
    var c = {};
    KEYS.forEach(function (k) { c[k] = state[k]; });
    return c;
  }

  // ─── Public API ───
  var api = {
    get: copy,
    set: function (key, value) {
      if (!valid(key, value)) return;
      if (key === 'pause') pauseChosen = true;
      state[key] = value;
      changed();
    },
    cycle: function (key) {
      if (!MAX.hasOwnProperty(key)) return;
      if (key === 'pause') pauseChosen = true;
      state[key] = (state[key] + 1) % (MAX[key] + 1);
      changed();
    },
    reset: function () {
      var keepPos = state.pos;
      state = defaults();
      pauseChosen = false;
      state.pause = osPause();
      state.pos = keepPos === 2 ? 0 : keepPos;
      changed();
    },
    open: function () { openPanel(); },
    close: function () { closePanel(); }
  };
  window.TMEA11y = api;

  // ─── UI ───
  var toggle, panel, closeBtn, moveBtn, tileEls = {}, lastFocus = null;
  var POS_LABELS = ['Bottom left', 'Bottom right', 'Hidden'];

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (a) { n.setAttribute(a, attrs[a]); });
    if (html != null) n.innerHTML = html;
    return n;
  }

  function build() {
    toggle = el('button', {
      id: 'a11y-toggle', 'class': 'a11y-toggle', type: 'button',
      'aria-label': 'Accessibility menu', 'aria-haspopup': 'dialog',
      'aria-expanded': 'false', 'aria-controls': 'a11y-panel'
    }, '<span aria-hidden="true">♿︎</span>');

    panel = el('div', {
      id: 'a11y-panel', 'class': 'a11y-panel', role: 'dialog',
      'aria-label': 'Accessibility Menu', hidden: ''
    });

    var head = el('div', { 'class': 'a11y-head' });
    head.appendChild(el('h2', { 'class': 'a11y-title' }, 'Accessibility Menu'));
    closeBtn = el('button', { id: 'a11y-close', 'class': 'a11y-close', type: 'button', 'aria-label': 'Close accessibility menu' }, '&times;');
    head.appendChild(closeBtn);
    panel.appendChild(head);

    var grid = el('div', { 'class': 'a11y-grid' });
    TILES.forEach(function (t) {
      var b = el('button', { 'class': 'a11y-tile', type: 'button', 'data-key': t.key, 'aria-pressed': 'false' });
      b.appendChild(el('span', { 'class': 'a11y-icon', 'aria-hidden': 'true' }, t.icon));
      b.appendChild(el('span', { 'class': 'a11y-label' }, t.label));
      var bars = el('span', { 'class': 'a11y-bars', 'aria-hidden': 'true' });
      if (t.steps.length > 1) {
        for (var i = 0; i < t.steps.length; i++) bars.appendChild(el('i'));
      }
      b.appendChild(bars);
      b.addEventListener('click', function () { api.cycle(t.key); });
      grid.appendChild(b);
      tileEls[t.key] = b;
    });
    panel.appendChild(grid);

    var foot = el('div', { 'class': 'a11y-foot' });
    var resetBtn = el('button', { id: 'a11y-reset', 'class': 'a11y-reset', type: 'button' }, 'Reset All Accessibility Settings');
    resetBtn.addEventListener('click', api.reset);
    moveBtn = el('button', { id: 'a11y-move', 'class': 'a11y-move', type: 'button' });
    moveBtn.addEventListener('click', function () { api.cycle('pos'); });
    foot.appendChild(resetBtn);
    foot.appendChild(moveBtn);
    panel.appendChild(foot);

    document.body.appendChild(toggle);
    document.body.appendChild(panel);

    toggle.addEventListener('click', function () { panel.hidden ? openPanel() : closePanel(); });
    closeBtn.addEventListener('click', closePanel);
    panel.addEventListener('keydown', trapFocus);
    render();
  }

  function render() {
    if (!panel) return;
    moveBtn.textContent = 'Move/Hide Widget: ' + POS_LABELS[state.pos];
    TILES.forEach(function (t) {
      var b = tileEls[t.key];
      var v = state[t.key];
      var on = v > 0;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-active', on);
      b.querySelector('.a11y-label').textContent = on && t.steps.length > 1 ? t.steps[v - 1] : t.label;
      b.setAttribute('aria-label', on ? t.label + ': ' + t.steps[v - 1] : t.label);
      var bars = b.querySelectorAll('.a11y-bars i');
      for (var i = 0; i < bars.length; i++) bars[i].classList.toggle('is-on', i < v);
    });
  }

  function focusables() {
    return Array.prototype.slice.call(panel.querySelectorAll('button:not([disabled]), a[href]'))
      .filter(function (n) { return n.offsetParent !== null; });
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    var list = focusables();
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openPanel() {
    if (!panel) return;
    lastFocus = document.activeElement;
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    closeBtn.focus();
  }

  function closePanel(refocus) {
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (refocus === false) { lastFocus = null; return; }
    var back = lastFocus && document.contains(lastFocus) && lastFocus.offsetParent !== null ? lastFocus : toggle;
    if (back && back.focus) back.focus();
    lastFocus = null;
  }

  // Esc closes the menu wherever focus is; a click outside it closes it too.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel && !panel.hidden) { e.preventDefault(); closePanel(); }
  });
  document.addEventListener('mousedown', function (e) {
    if (!panel || panel.hidden) return;
    var t = e.target;
    if (panel.contains(t) || toggle.contains(t) || (t.closest && t.closest('.a11y-footer-link'))) return;
    closePanel(false);
  });

  // Footer link ("Accessibility settings") always reopens the menu, even when
  // the floating button is hidden. Delegated so it works before the DOM is ready.
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('.a11y-footer-link');
    if (!link) return;
    e.preventDefault();
    openPanel();
  });

  function ready() { build(); applyMotion(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
