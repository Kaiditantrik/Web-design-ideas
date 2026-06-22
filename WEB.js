/* ============================================================
   KAIDITANTRIK — main.js
   Handles: age gate, nav, particles, scroll reveals,
   FAQ accordion, flavor quiz, store locator, forms, toast
   ============================================================ */

'use strict';

/* ── UTILITIES ─────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

function showToast(msg, duration = 3000) {
  const toast = $('#toast');
  const text  = $('#toast-msg');
  if (!toast || !text) return;
  text.textContent = msg;
  toast.removeAttribute('hidden');
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.setAttribute('hidden', ''), 400);
  }, duration);
}

/* ── AGE GATE ─────────────────────────────────────────────── */
(function initAgeGate() {
  const gate = $('#age-gate');
  if (!gate) return;

  // Skip if already verified this session
  if (sessionStorage.getItem('kdt_age_ok') === '1') {
    gate.setAttribute('hidden', '');
    return;
  }

  on($('#age-yes'), 'click', () => {
    sessionStorage.setItem('kdt_age_ok', '1');
    gate.classList.add('hidden');
    setTimeout(() => gate.setAttribute('hidden', ''), 650);
  });

  on($('#age-no'), 'click', () => {
    window.location.href = 'https://www.who.int/';
  });
})();

/* ── STICKY NAV ────────────────────────────────────────────── */
(function initNav() {
  const header = $('#site-header');
  const burger = $('#hamburger');
  const nav    = $('#main-nav');
  if (!header) return;

  // Scroll: add .scrolled class
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  };
  on(window, 'scroll', onScroll, { passive: true });
  onScroll();

  // Active nav link on scroll
  const sections = $$('section[id], div[id="home"]');
  const links    = $$('.nav__link');

  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(l => {
          l.classList.toggle('active',
            l.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => navObserver.observe(s));

  // Mobile hamburger
  on(burger, 'click', () => {
    const open = burger.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close nav on link click
  $$('.nav__link').forEach(link => {
    on(link, 'click', () => {
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  on(document, 'click', e => {
    if (nav.classList.contains('open') &&
        !nav.contains(e.target) &&
        !burger.contains(e.target)) {
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // Language toggle
  $$('.lang-btn').forEach(btn => {
    on(btn, 'click', () => {
      $$('.lang-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      // In production: swap i18n content here
      if (btn.dataset.lang === 'hi') {
        showToast('हिंदी — जल्द आ रहा है! (Coming soon)');
      }
    });
  });
})();

/* ── PARTICLE CANVAS ───────────────────────────────────────── */
(function initParticles() {
  const canvas = $('#particle-canvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles, animFrame;

  const COLORS = [
    'rgba(124,58,237,',
    'rgba(168,85,247,',
    'rgba(245,158,11,',
    'rgba(192,132,252,',
  ];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function makeParticle() {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.15 + Math.random() * 0.3;
    return {
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     0.5 + Math.random() * 1.5,
      vx:    Math.cos(angle) * speed,
      vy:    Math.sin(angle) * speed,
      alpha: 0.2 + Math.random() * 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function init() {
    resize();
    const count = Math.min(Math.floor((W * H) / 8000), 120);
    particles = Array.from({ length: count }, makeParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ')';
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -2)  p.x = W + 2;
      if (p.x > W+2) p.x = -2;
      if (p.y < -2)  p.y = H + 2;
      if (p.y > H+2) p.y = -2;
    });
    animFrame = requestAnimationFrame(draw);
  }

  init();
  draw();

  // Parallax on mousemove
  let mx = 0, my = 0;
  on(document, 'mousemove', e => {
    mx = (e.clientX / W - 0.5) * 0.4;
    my = (e.clientY / H - 0.5) * 0.4;
    particles.forEach(p => {
      p.vx += mx * 0.002;
      p.vy += my * 0.002;
      // Clamp speed
      const spd = Math.hypot(p.vx, p.vy);
      if (spd > 1.2) { p.vx *= 0.95; p.vy *= 0.95; }
    });
  });

  const ro = new ResizeObserver(() => { init(); });
  ro.observe(canvas);
})();

/* ── SCROLL REVEAL (IntersectionObserver) ──────────────────── */
(function initReveal() {
  const targets = $$('.reveal, .reveal-left, .reveal-right, .flavor-card, .ingredient-card, .ambassador-card, .journal-card');

  if (!targets.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(t => observer.observe(t));

  // Add reveal class to section headers & misc
  $$('.section-header, .story__copy, .story__visual, .signup__copy, .signup__form, .notify-form, .quiz-cta, .responsible-notice').forEach(el => {
    if (!el.classList.contains('reveal') &&
        !el.classList.contains('reveal-left') &&
        !el.classList.contains('reveal-right')) {
      el.classList.add('reveal');
      observer.observe(el);
    }
  });
})();

/* ── FAQ ACCORDION ─────────────────────────────────────────── */
(function initFAQ() {
  $$('.faq-question').forEach(btn => {
    on(btn, 'click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const answerId = btn.getAttribute('aria-controls');
      const answer   = $('#' + answerId);
      if (!answer) return;

      // Close all others
      $$('.faq-question').forEach(b => {
        if (b !== btn) {
          b.setAttribute('aria-expanded', 'false');
          const a = $('#' + b.getAttribute('aria-controls'));
          if (a) a.setAttribute('hidden', '');
        }
      });

      // Toggle this one
      btn.setAttribute('aria-expanded', String(!expanded));
      if (expanded) {
        answer.setAttribute('hidden', '');
      } else {
        answer.removeAttribute('hidden');
      }
    });
  });
})();

/* ── FLAVOR QUIZ ────────────────────────────────────────────── */
(function initQuiz() {
  const openBtn   = $('#open-quiz');
  const modal     = $('#quiz-modal');
  const backdrop  = $('#quiz-backdrop');
  const closeBtn  = $('#quiz-close');
  const container = $('#quiz-container');
  if (!openBtn || !modal || !container) return;

  const steps = [
    {
      q: "What's your main grind right now?",
      opts: [
        { icon: '📚', label: 'Studying / exam prep',  value: 'study'  },
        { icon: '🎮', label: 'Gaming sessions',         value: 'gaming' },
        { icon: '💪', label: 'Gym / pre-workout',       value: 'gym'    },
        { icon: '🌙', label: 'Late-night work shifts',  value: 'night'  },
      ]
    },
    {
      q: "How do you handle heat?",
      opts: [
        { icon: '🔥', label: 'Bring it — I run hot',     value: 'hot'    },
        { icon: '❄',  label: 'Cool and icy, always',     value: 'cold'   },
        { icon: '⚡',  label: 'Balanced — a smooth surge', value: 'balanced'},
      ]
    },
    {
      q: "Sugar — yes or no?",
      opts: [
        { icon: '✓',  label: 'Yes, give me the full hit', value: 'sugar'   },
        { icon: '○',  label: 'No — zero all the way',     value: 'no-sugar'},
      ]
    },
  ];

  const resultMap = {
    'study-cold-sugar':       'Frost',
    'study-cold-no-sugar':    'Zero',
    'study-balanced-sugar':   'Original',
    'study-balanced-no-sugar':'Zero',
    'study-hot-sugar':        'Original',
    'study-hot-no-sugar':     'Zero',
    'gaming-cold-sugar':      'Frost',
    'gaming-cold-no-sugar':   'Zero',
    'gaming-balanced-sugar':  'Original',
    'gaming-balanced-no-sugar':'Zero',
    'gaming-hot-sugar':       'Inferno',
    'gaming-hot-no-sugar':    'Zero',
    'gym-hot-sugar':          'Inferno',
    'gym-hot-no-sugar':       'Inferno',
    'gym-cold-sugar':         'Frost',
    'gym-cold-no-sugar':      'Zero',
    'gym-balanced-sugar':     'Original',
    'gym-balanced-no-sugar':  'Zero',
    'night-cold-sugar':       'Frost',
    'night-cold-no-sugar':    'Zero',
    'night-balanced-sugar':   'Original',
    'night-balanced-no-sugar':'Zero',
    'night-hot-sugar':        'Inferno',
    'night-hot-no-sugar':     'Zero',
  };

  const flavorDesc = {
    Original: { color: '#f59e0b', desc: 'Citrus surge with a volcanic finish — balanced energy for any session. Caffeine: 150mg.' },
    Inferno:  { color: '#ef4444', desc: 'Mango-chili heat that builds with every sip. For those who run hot. Caffeine: 180mg.' },
    Frost:    { color: '#38bdf8', desc: 'Arctic mint and white grape — ice-cold clarity for marathon sessions. Caffeine: 150mg.' },
    Zero:     { color: '#a78bfa', desc: 'All the ritual, none the sugar. Pure focus, zero compromise. Caffeine: 150mg.' },
  };

  let currentStep = 0;
  let answers = [];

  function buildQuiz() {
    currentStep = 0;
    answers = [];

    const progress = steps.map((_, i) =>
      `<div class="quiz__progress-dot${i === 0 ? ' done' : ''}" id="qdot-${i}"></div>`
    ).join('');

    const stepHTML = steps.map((step, si) => `
      <div class="quiz__step${si === 0 ? ' active' : ''}" id="qstep-${si}">
        <p class="quiz__eyebrow">Step ${si + 1} of ${steps.length}</p>
        <h3 class="quiz__question">${step.q}</h3>
        <div class="quiz__options">
          ${step.opts.map(opt => `
            <button class="quiz__option" data-step="${si}" data-value="${opt.value}">
              <span class="quiz__option-icon">${opt.icon}</span>
              ${opt.label}
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');

    const resultHTML = `
      <div class="quiz__step" id="qstep-result">
        <div class="quiz__result">
          <p class="quiz__eyebrow">Your Kaiditantrik</p>
          <div id="quiz-result-sigil" style="font-size:2rem;margin:0.5rem 0">☽✦☾</div>
          <h3 class="quiz__result-name" id="quiz-result-name">—</h3>
          <p class="quiz__result-desc" id="quiz-result-desc"></p>
          <a href="#where-to-buy" class="btn btn--fire" id="quiz-buy-btn">Find it near you</a>
          <button class="quiz__back" id="quiz-restart">Take it again</button>
        </div>
      </div>
    `;

    container.innerHTML = `
      <div class="quiz__progress">${progress}</div>
      ${stepHTML}
      ${resultHTML}
    `;

    // Bind option clicks
    $$('.quiz__option', container).forEach(btn => {
      on(btn, 'click', () => {
        const si  = parseInt(btn.dataset.step);
        const val = btn.dataset.value;
        answers[si] = val;
        goTo(si + 1);
      });
    });

    on($('#quiz-restart', container), 'click', () => buildQuiz());
    on($('#quiz-buy-btn',  container), 'click', closeQuiz);
  }

  function goTo(idx) {
    // Update progress dots
    steps.forEach((_, i) => {
      const dot = $(`#qdot-${i}`, container);
      if (dot) dot.classList.toggle('done', i <= idx - 1);
    });

    // Hide all steps
    $$('.quiz__step', container).forEach(s => s.classList.remove('active'));

    if (idx >= steps.length) {
      // Show result
      const key    = answers.join('-');
      const flavor = resultMap[key] || 'Original';
      const info   = flavorDesc[flavor];
      const nameEl = $('#quiz-result-name', container);
      const descEl = $('#quiz-result-desc', container);
      if (nameEl) { nameEl.textContent = flavor; nameEl.style.color = info.color; }
      if (descEl) descEl.textContent = info.desc;
      const resultStep = $('#qstep-result', container);
      if (resultStep) resultStep.classList.add('active');
    } else {
      const nextStep = $(`#qstep-${idx}`, container);
      if (nextStep) {
        nextStep.classList.add('active');
        currentStep = idx;
      }
    }
  }

  function openQuiz() {
    buildQuiz();
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const first = $('.quiz__option', container);
      if (first) first.focus();
    }, 100);
  }

  function closeQuiz() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  on(openBtn,   'click', openQuiz);
  on(closeBtn,  'click', closeQuiz);
  on(backdrop,  'click', closeQuiz);
  on(document,  'keydown', e => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeQuiz();
  });
})();

/* ── STORE LOCATOR ─────────────────────────────────────────── */
(function initStoreLocator() {
  const input   = $('#locator-input');
  const searchBtn = $('#locator-search');
  const results = $('#store-results');
  const mapDiv  = $('#store-map');
  const pills   = $$('.filter-pill');
  if (!input || !searchBtn) return;

  // Mock store data
  const storeData = [
    { name: 'D-Mart Sector 18', addr: 'Sector 18, Noida, UP', type: 'modern-trade', pin: ['201301','noida'] },
    { name: "Ramesh Kirana Store", addr: 'Model Town, Delhi', type: 'kirana', pin: ['110009','delhi','model town'] },
    { name: 'Reliance Smart', addr: 'Connaught Place, Delhi', type: 'modern-trade', pin: ['110001','delhi','cp'] },
    { name: 'Blinkit Dark Store', addr: 'Indiranagar, Bengaluru', type: 'quick-commerce', pin: ['560038','bangalore','bengaluru','indiranagar'] },
    { name: 'Zepto Hub', addr: 'Koramangala, Bengaluru', type: 'quick-commerce', pin: ['560034','bengaluru','bangalore','koramangala'] },
    { name: "Suresh General Store", addr: 'Lajpat Nagar, Delhi', type: 'kirana', pin: ['110024','delhi','lajpat'] },
    { name: 'Big Bazaar', addr: 'Phoenix Mall, Mumbai', type: 'modern-trade', pin: ['400012','mumbai','phoenix'] },
    { name: 'Instamart Partner', addr: 'Andheri West, Mumbai', type: 'quick-commerce', pin: ['400058','mumbai','andheri'] },
    { name: 'StarBazaar', addr: 'Powai, Mumbai', type: 'modern-trade', pin: ['400076','mumbai','powai'] },
    { name: "Gopal Kirana", addr: 'Satellite, Ahmedabad', type: 'kirana', pin: ['380015','ahmedabad','satellite'] },
  ];

  const typeLabels = {
    'kirana':        'Kirana',
    'modern-trade':  'Modern Trade',
    'quick-commerce':'Quick Commerce',
  };

  let activeFilter = 'all';

  pills.forEach(p => {
    on(p, 'click', () => {
      pills.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      activeFilter = p.dataset.filter;
    });
  });

  function renderResults(stores) {
    if (!results) return;
    results.innerHTML = '';

    if (!stores.length) {
      results.innerHTML = '<li style="color:var(--muted);font-size:.9rem;text-align:center;padding:1rem 0">No stores found in that area yet. <a href="#where-to-buy" style="color:var(--purple-glow)">Check quick-commerce options above.</a></li>';
      return;
    }

    stores.forEach(s => {
      const li = document.createElement('li');
      li.className = 'store-result-item reveal';
      li.innerHTML = `
        <div>
          <div class="store-result__name">${s.name}</div>
          <div class="store-result__addr">${s.addr}</div>
        </div>
        <span class="store-result__type">${typeLabels[s.type] || s.type}</span>
      `;
      results.appendChild(li);
      // Animate in
      requestAnimationFrame(() => li.classList.add('revealed'));
    });
  }

  function doSearch() {
    const q = input.value.trim().toLowerCase();
    if (!q) { showToast('Enter a city or PIN code to search'); return; }

    const filtered = storeData.filter(s => {
      const matchQ    = s.pin.some(p => p.includes(q)) || s.addr.toLowerCase().includes(q);
      const matchType = activeFilter === 'all' || s.type === activeFilter;
      return matchQ && matchType;
    });

    renderResults(filtered);

    // Update map placeholder
    if (mapDiv) {
      const ph = $('.store-map__placeholder', mapDiv);
      if (ph) {
        ph.innerHTML = filtered.length
          ? `<span class="map-icon" aria-hidden="true">📍</span><p>${filtered.length} store${filtered.length !== 1 ? 's' : ''} found near <strong>${input.value}</strong></p>`
          : `<span class="map-icon" aria-hidden="true">⊕</span><p>No results — try a different area</p>`;
      }
    }
  }

  on(searchBtn, 'click', doSearch);
  on(input, 'keydown', e => { if (e.key === 'Enter') doSearch(); });
})();

/* ── NOTIFY ME FORM ────────────────────────────────────────── */
(function initNotify() {
  const btn   = $('#notify-submit');
  const email = $('#notify-email');
  const city  = $('#notify-city');
  const msg   = $('#notify-msg');
  if (!btn) return;

  on(btn, 'click', () => {
    const e = email?.value.trim();
    const c = city?.value.trim();

    if (!e || !e.includes('@')) {
      if (msg) { msg.textContent = 'Please enter a valid email address.'; msg.style.color = 'var(--fire)'; }
      email?.focus();
      return;
    }
    if (!c) {
      if (msg) { msg.textContent = 'Please enter your city or PIN code.'; msg.style.color = 'var(--fire)'; }
      city?.focus();
      return;
    }

    btn.textContent = '...';
    btn.disabled = true;

    // Simulate API call
    setTimeout(() => {
      if (msg) { msg.textContent = `Done! We'll notify ${e} when Kaiditantrik reaches ${c}.`; msg.style.color = '#4ade80'; }
      if (email) email.value = '';
      if (city)  city.value  = '';
      btn.textContent = 'Notify me';
      btn.disabled = false;
      showToast('You\'re on the list! ⚡');
    }, 1000);
  });
})();

/* ── RETAILER INQUIRY FORM ─────────────────────────────────── */
(function initRetailerForm() {
  const form = $('#retailer-form');
  const msg  = $('#retailer-msg');
  if (!form) return;

  on(form, 'submit', e => {
    e.preventDefault();
    const name  = $('#ret-name',  form)?.value.trim();
    const biz   = $('#ret-biz',   form)?.value.trim();
    const type  = $('#ret-type',  form)?.value;
    const loc   = $('#ret-location', form)?.value.trim();
    const email = $('#ret-email', form)?.value.trim();

    if (!name || !biz || !type || !loc || !email) {
      if (msg) { msg.textContent = 'Please fill in all required fields.'; msg.className = 'form-msg form-msg--error'; }
      return;
    }
    if (!email.includes('@')) {
      if (msg) { msg.textContent = 'Please enter a valid email address.'; msg.className = 'form-msg form-msg--error'; }
      return;
    }

    const submit = $('button[type="submit"]', form);
    if (submit) { submit.textContent = 'Sending...'; submit.disabled = true; }

    setTimeout(() => {
      if (msg) {
        msg.textContent = `Thank you, ${name}! Our sales team will reach out to ${email} within 2 business days.`;
        msg.className = 'form-msg form-msg--success';
      }
      form.reset();
      if (submit) { submit.textContent = 'Submit inquiry'; submit.disabled = false; }
      showToast('Inquiry received! ✦');
    }, 1200);
  });
})();

/* ── EMAIL / SMS SIGNUP ────────────────────────────────────── */
(function initSignup() {
  const form  = $('#signup-form');
  const email = $('#signup-email');
  const flavor= $('#signup-flavor');
  const msg   = $('#signup-msg');
  if (!form) return;

  on(form, 'submit', e => {
    e.preventDefault();
    const em = email?.value.trim();
    const fl = flavor?.value;

    if (!em || !em.includes('@')) {
      if (msg) { msg.textContent = 'Enter a valid email.'; msg.style.color = 'var(--fire)'; }
      email?.focus();
      return;
    }

    const btn = $('button[type="submit"]', form);
    if (btn) { btn.textContent = 'Joining...'; btn.disabled = true; }

    setTimeout(() => {
      if (msg) {
        msg.textContent = fl && fl !== 'undecided'
          ? `You're in! Expect ${fl.charAt(0).toUpperCase() + fl.slice(1)} drops in your inbox. ⚡`
          : 'You\'re in the current. ⚡';
        msg.style.color = '#4ade80';
      }
      form.reset();
      if (btn) { btn.textContent = 'Join the current'; btn.disabled = false; }
      showToast('Welcome to the current! ⚡');
    }, 1000);
  });
})();

/* ── SMOOTH SECTION TRANSITIONS (Shopify-style stagger) ──────
   Each section fades + translates in as it enters the viewport,
   with a brief stagger between sibling elements              */
(function initSectionTransitions() {
  // Section-level parallax background layers
  const hero = $('.hero');
  if (!hero) return;

  on(window, 'scroll', () => {
    const scrollY = window.scrollY;
    const rate    = scrollY * 0.25;
    if (hero) hero.style.setProperty('--hero-scroll', `${rate}px`);
  }, { passive: true });
})();

/* ── CAN HOVER TILT (hero can) ──────────────────────────────── */
(function initCanTilt() {
  const wrap = $('.hero__can');
  if (!wrap) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canBody = $('.can__body', wrap);
  if (!canBody) return;

  on(wrap, 'mousemove', e => {
    const rect = wrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    canBody.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 12}deg) translateY(${Math.sin(Date.now() / 1000) * 8}px)`;
  });

  on(wrap, 'mouseleave', () => {
    canBody.style.transform = '';
  });
})();

/* ── FLAVOR CARD PARALLAX GLOW (follow cursor) ────────────── */
(function initCardGlow() {
  $$('.flavor-card').forEach(card => {
    on(card, 'mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
      const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    });
  });
})();

/* ── TICKER DUPLICATE CHECK ─────────────────────────────────── */
(function ensureTicker() {
  const track = $('.ticker__track');
  if (!track) return;
  // Already duplicated in HTML; just make sure animation works
  // by checking the track is at least 2× visible width
  const items = $$('.ticker__item', track);
  if (items.length < 8) {
    // Duplicate if not enough
    const clone = track.innerHTML;
    track.innerHTML += clone;
  }
})();

/* ── MANDALA INTERACTION ────────────────────────────────────── */
(function initMandala() {
  const svg = $('.mandala-svg');
  if (!svg) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Speed up rotation on hover
  on(svg.parentElement, 'mouseenter', () => {
    svg.style.animationDuration = '8s';
  });
  on(svg.parentElement, 'mouseleave', () => {
    svg.style.animationDuration = '40s';
  });
})();

/* ── FOCUS TRAP (modal) ─────────────────────────────────────── */
(function initFocusTrap() {
  const modal = $('#quiz-modal');
  if (!modal) return;

  on(modal, 'keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = $$('button, input, a, select, textarea, [tabindex]:not([tabindex="-1"])', modal);
    const visible   = focusable.filter(el => !el.closest('[hidden]'));
    if (!visible.length) return;
    const first = visible[0];
    const last  = visible[visible.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
})();

/* ── PERFORMANCE: lazy-load section backgrounds ────────────── */
(function lazyBg() {
  // The UGC items and ambassador images use CSS gradients (no real images),
  // so no lazy loading needed in this prototype.
  // In production: use IntersectionObserver + data-src on <img>.
})();

/* ── INIT COMPLETE ──────────────────────────────────────────── */
console.log('%cKaiditantrik ☽✦☾ — Break the cage. Awaken the current.', 'font-family: serif; font-size: 1rem; color: #a855f7; font-weight: bold;');