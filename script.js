const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- Theme toggle (dark by default, remembered between visits) ----------
const themeToggle = document.querySelector('#theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#070920' : '#ece8fb');
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
}
applyTheme(root.getAttribute('data-theme') || 'dark');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
  });
}

// ---------- Mobile menu ----------
const menuToggle = document.querySelector('#menu-toggle');
const navLinks = document.querySelector('#nav-links');
if (menuToggle && navLinks) {
  const setOpen = (open) => {
    navLinks.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  };
  menuToggle.addEventListener('click', () => setOpen(!navLinks.classList.contains('is-open')));
  navLinks.querySelectorAll('a').forEach((l) => l.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

// ---------- Footer year ----------
const yearEl = document.querySelector('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- Scroll progress bar ----------
const bar = document.querySelector('.progress span');
let ticking = false;
function updateProgress() {
  ticking = false;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (bar) bar.parentElement.style.setProperty('--p', max > 0 ? Math.min(window.scrollY / max, 1).toFixed(4) : 0);
}
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); } }, { passive: true });
updateProgress();

// ---------- Active nav link ----------
const links = [...document.querySelectorAll('.nav-links a')];
const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window && sections.length) {
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      const active = links.find((a) => a.getAttribute('href') === '#' + entry.target.id);
      if (active) active.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach((s) => navIO.observe(s));
}

// ---------- Scroll reveal + count-up ----------
function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.dec || '0', 10);
  if (reduceMotion || isNaN(target)) { el.textContent = target.toFixed(dec); return; }
  const start = performance.now(), dur = 1400;
  (function tick(now) {
    const t = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = (target * eased).toFixed(dec);
    if (t < 1) requestAnimationFrame(tick);
  })(start);
}
const reveals = document.querySelectorAll('.reveal');
const counters = document.querySelectorAll('[data-count]');
if ('IntersectionObserver' in window) {
  const revealIO = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      entry.target.querySelectorAll('[data-count]').forEach(countUp);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  reveals.forEach((el) => revealIO.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

// ---------- Copy email ----------
const toast = document.querySelector('#toast');
let toastTimer;
function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}
document.querySelectorAll('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    try { await navigator.clipboard.writeText(text); showToast('Email copied to clipboard'); }
    catch (e) { showToast(text); }
  });
});

// ---------- 3D pointer effects (mouse / trackpad only, never with reduced motion) ----------
if (canHover && !reduceMotion) {
  // Soft glare on every glass card
  document.querySelectorAll('.skill-group, .education-card, .timeline-content, .about-facts > div, .metric')
    .forEach((el) => el.setAttribute('data-glow', ''));

  document.querySelectorAll('[data-tilt], [data-glow]').forEach((card) => {
    const tilts = card.hasAttribute('data-tilt');
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      if (tilts) {
        card.style.setProperty('--ry', ((x - 0.5) * 6).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * 5).toFixed(2) + 'deg');
      }
    });
    if (tilts) card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--rx'); card.style.removeProperty('--ry');
    });
  });

  // Magnetic buttons
  document.querySelectorAll('.button').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * 0.12).toFixed(1) + 'px');
      btn.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * 0.18).toFixed(1) + 'px');
    });
    btn.addEventListener('pointerleave', () => { btn.style.removeProperty('--bx'); btn.style.removeProperty('--by'); });
  });

  // Hero panel, background parallax and cursor spotlight
  const hero = document.querySelector('.hero');
  const panel = document.querySelector('.hero-glass-panel');
  let frame = null;
  window.addEventListener('pointermove', (e) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      const mx = (e.clientX / window.innerWidth - 0.5) * 2;
      const my = (e.clientY / window.innerHeight - 0.5) * 2;
      root.style.setProperty('--mx', mx.toFixed(3));
      root.style.setProperty('--my', my.toFixed(3));
      root.style.setProperty('--px', e.clientX + 'px');
      root.style.setProperty('--py', e.clientY + 'px');
      if (panel && hero) {
        const r = hero.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          panel.style.setProperty('--ry', (mx * 7).toFixed(2) + 'deg');
          panel.style.setProperty('--rx', (-my * 6).toFixed(2) + 'deg');
        }
      }
    });
  }, { passive: true });
}
