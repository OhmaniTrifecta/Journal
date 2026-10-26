'use strict';
(() => {
  /* =========================================================
     Helpers
     ========================================================= */
  const $ = (s, r = document) => r.querySelector(s);
  const app = $('#app');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const countWords = (s) => (String(s || '').trim().match(/\S+/g) || []).length;
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Dates are stored as local "YYYY-MM-DD" keys so time zones never shift a day.
  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayKey = () => dateKey(new Date());
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d); };
  const fmt = (k, opts) => parseKey(k).toLocaleDateString('en-US', opts);
  const fmtLong = (k) => fmt(k, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const fmtShort = (k) => fmt(k, { weekday: 'short', month: 'short', day: 'numeric' });

  /* =========================================================
     Content
     ========================================================= */
  const MOODS = [
    { id: 'amazing', e: '🤩', l: 'Amazing' },
    { id: 'happy', e: '😊', l: 'Happy' },
    { id: 'calm', e: '😌', l: 'Calm' },
    { id: 'silly', e: '🤪', l: 'Silly' },
    { id: 'meh', e: '😐', l: 'Meh' },
    { id: 'worried', e: '😟', l: 'Worried' },
    { id: 'sad', e: '😢', l: 'Sad' },
    { id: 'mad', e: '😤', l: 'Mad' },
  ];
  const TOUGH_MOODS = ['worried', 'sad', 'mad'];
  const moodOf = (id) => MOODS.find((m) => m.id === id);

  const PROMPTS = [
    'What made you smile today?',
    'What is something you are really proud of?',
    'Describe your perfect weekend.',
    'Who is someone who always makes you laugh? Why?',
    'What is a song that matches your mood right now?',
    'If you could have any superpower, what would it be?',
    'What is a goal you want to reach this year?',
    'Write about a favorite memory with a friend.',
    'What are three things you love about yourself?',
    'If you could travel anywhere, where would you go?',
    'What is something new you learned recently?',
    'Describe your dream bedroom.',
    'What is the best compliment you have ever gotten?',
    'What would your perfect day look like from start to finish?',
    'What is something that is hard for you right now? What might help?',
    'Write a letter to yourself one year from now.',
    'What is a book, show, or movie you love? Why?',
    'Who is someone you look up to?',
    'What is something kind you did for someone?',
    'What is something kind someone did for you?',
    'What does a cozy day look like for you?',
    'If you had a pet dragon, what would you name it?',
    'What are you looking forward to this week?',
    'Describe yourself in five words.',
    'What is a fear you want to overcome?',
    'What is your favorite season and why?',
    'If you could invent something, what would it be?',
    'What is your favorite thing about your family?',
    'What is a small thing that made today better?',
    'What would you tell a younger version of yourself?',
    'What do you want to be really good at someday?',
    'Write about a time you were brave.',
    'What is your comfort food?',
    'What is the funniest thing that happened recently?',
    'What does being a good friend mean to you?',
    'If you could switch lives with someone for a day, who would it be?',
    'What is a place where you feel totally happy?',
    'What are you grateful for right now?',
    'What is something you would like to try for the first time?',
    'Describe today using only emojis, then explain them!',
    'What is the best advice you have ever gotten?',
    'If your life was a movie, what would it be called?',
    'What helps you calm down when you feel stressed?',
    'What is something that surprised you lately?',
    'Make a list of 10 things that make you happy.',
    'What is a tradition you love?',
    'What would you do with a whole day of no rules?',
    'What is a challenge you handled well?',
    'What is your favorite way to be creative?',
    'What is one thing you want to remember about today?',
  ];

  const CHEERS = [
    'Saved! You are awesome 💖',
    'Another page of your story ✨',
    'Nice writing! 🌟',
    'Your journal loves you 💕',
    'Way to go! 🌈',
    'Ta-da! Saved 🎀',
  ];

  const AFFIRMATIONS = [
    'You are doing amazing.',
    'Your thoughts matter.',
    'Today is a fresh page.',
    'Be proud of how far you have come.',
    'You are kind, smart, and important.',
    'Little steps still count.',
    'Your story is worth writing.',
    'It is okay to feel all your feelings.',
    'You make the world brighter.',
    'Believe in yourself — I do!',
  ];

  // Each sticker unlocks when its test passes on the current stats.
  const STICKERS = [
    { id: 'first', s: '🌱', n: 'First Page', h: 'Write your first entry', t: (s) => s.count >= 1 },
    { id: 'e10', s: '🌸', n: 'Blooming', h: 'Write 10 entries', t: (s) => s.count >= 10 },
    { id: 'e25', s: '🌻', n: 'Sunflower', h: 'Write 25 entries', t: (s) => s.count >= 25 },
    { id: 'e50', s: '🦄', n: 'Unicorn Writer', h: 'Write 50 entries', t: (s) => s.count >= 50 },
    { id: 'e100', s: '👑', n: 'Journal Queen', h: 'Write 100 entries', t: (s) => s.count >= 100 },
    { id: 's3', s: '🔥', n: 'On Fire', h: 'Write 3 days in a row', t: (s) => s.best >= 3 },
    { id: 's7', s: '⭐', n: 'Superstar Week', h: 'Write 7 days in a row', t: (s) => s.best >= 7 },
    { id: 's14', s: '🌈', n: 'Rainbow Streak', h: 'Write 14 days in a row', t: (s) => s.best >= 14 },
    { id: 's30', s: '🏆', n: 'Champion', h: 'Write 30 days in a row', t: (s) => s.best >= 30 },
    { id: 'grat', s: '💖', n: 'Grateful Heart', h: 'Fill in all 3 good things', t: (s) => s.gratitude },
    { id: 'photo', s: '📸', n: 'Snapshot', h: 'Add a photo to an entry', t: (s) => s.photos >= 1 },
    { id: 'fav', s: '💝', n: 'Faves', h: 'Heart 5 entries', t: (s) => s.favorites >= 5 },
    { id: 'w1k', s: '✏️', n: 'Wordsmith', h: 'Write 1,000 words total', t: (s) => s.words >= 1000 },
    { id: 'w10k', s: '📚', n: 'Author', h: 'Write 10,000 words total', t: (s) => s.words >= 10000 },
    { id: 'moods', s: '🎨', n: 'Feelings Artist', h: 'Use 6 different moods', t: (s) => s.moods >= 6 },
    { id: 'owl', s: '🦉', n: 'Night Owl', h: 'Write after 9 pm', t: (s) => s.night },
    { id: 'bird', s: '🐦', n: 'Early Bird', h: 'Write before 8 am', t: (s) => s.early },
    { id: 'prompt', s: '💡', n: 'Big Thinker', h: 'Answer 5 prompts', t: (s) => s.prompts >= 5 },
  ];

  const THEMES = [
    { id: 'pink', n: 'Bubblegum', c: '#ff6fa5', bar: '#ffe3ee' },
    { id: 'lavender', n: 'Lavender', c: '#9b7bff', bar: '#ebe2ff' },
    { id: 'mint', n: 'Mint', c: '#2fbf8f', bar: '#d9f5e8' },
    { id: 'peach', n: 'Peach', c: '#ff8a5c', bar: '#ffe6d3' },
    { id: 'sky', n: 'Sky', c: '#4a9dff', bar: '#dcebff' },
    { id: 'night', n: 'Starry Night', c: '#6b5fa8', bar: '#1d1b2e' },
  ];

  /* =========================================================
     Settings (small stuff, localStorage)
     ========================================================= */
  const SKEY = 'journal.settings';
  const DEFAULTS = { name: '', theme: 'pink', pinHash: '', pinHint: '', onboarded: false, stickers: {}, lockAfter: 60, promptOffset: 0, lastBackup: 0, hideInstallTip: false };
  let settings = loadSettings();
  function loadSettings() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SKEY) || '{}') }; } catch { return { ...DEFAULTS }; }
  }
  function saveSettings() {
    try { localStorage.setItem(SKEY, JSON.stringify(settings)); } catch { /* storage full or blocked */ }
  }
  function applyTheme() {
    document.body.dataset.theme = settings.theme;
    const t = THEMES.find((x) => x.id === settings.theme) || THEMES[0];
    $('meta[name="theme-color"]').setAttribute('content', t.bar);
    document.title = settings.name ? `${settings.name}'s Journal` : 'My Journal';
  }

  async function hashPin(pin) {
    const data = new TextEncoder().encode('journal-pin:' + pin);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /* =========================================================
     Database (entries + photos, IndexedDB)
     ========================================================= */
  let dbPromise;
  function db() {
    return dbPromise ||= new Promise((res, rej) => {
      const r = indexedDB.open('journal', 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore('entries', { keyPath: 'id' });
        r.result.createObjectStore('photos', { keyPath: 'id' });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function tx(store, mode, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode);
      let out;
      const req = fn(t.objectStore(store));
      if (req) req.onsuccess = () => { out = req.result; };
      t.oncomplete = () => res(out);
      t.onerror = t.onabort = () => rej(t.error);
    });
  }
  const idb = {
    all: (store) => tx(store, 'readonly', (s) => s.getAll()),
    get: (store, id) => tx(store, 'readonly', (s) => s.get(id)),
    put: (store, v) => tx(store, 'readwrite', (s) => s.put(v)),
    del: (store, id) => tx(store, 'readwrite', (s) => s.delete(id)),
    clear: (store) => tx(store, 'readwrite', (s) => s.clear()),
  };

  let entries = [];
  async function loadEntries() {
    entries = await idb.all('entries');
    sortEntries();
  }
  function sortEntries() {
    entries.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }

  // Photos are stored as ArrayBuffers (safest on iOS) and shown via object URLs.
  const photoUrls = new Map();
  async function photoUrl(id) {
    if (photoUrls.has(id)) return photoUrls.get(id);
    const p = await idb.get('photos', id);
    if (!p) return '';
    const url = URL.createObjectURL(new Blob([p.data], { type: p.type }));
    photoUrls.set(id, url);
    return url;
  }
  function hydratePhotos(root = document) {
    root.querySelectorAll('img[data-photo]').forEach(async (img) => {
      const url = await photoUrl(img.dataset.photo);
      if (url) img.src = url;
    });
  }
  async function deletePhoto(id) {
    await idb.del('photos', id);
    if (photoUrls.has(id)) { URL.revokeObjectURL(photoUrls.get(id)); photoUrls.delete(id); }
  }
  async function savePhotoFile(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const max = 1400;
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.82));
      const id = uid();
      await idb.put('photos', { id, type: 'image/jpeg', data: await blob.arrayBuffer() });
      return id;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /* =========================================================
     Stats, streaks, stickers, prompts
     ========================================================= */
  function stats() {
    const dates = new Set(entries.map((e) => e.date));
    let streak = 0;
    let k = todayKey();
    if (!dates.has(k)) k = addDays(k, -1);
    while (dates.has(k)) { streak++; k = addDays(k, -1); }

    let best = 0, run = 0, prev = null;
    [...dates].sort().forEach((d) => {
      run = prev && addDays(prev, 1) === d ? run + 1 : 1;
      best = Math.max(best, run);
      prev = d;
    });

    const hours = entries.map((e) => new Date(e.createdAt).getHours());
    return {
      count: entries.length,
      streak,
      best,
      wroteToday: dates.has(todayKey()),
      words: entries.reduce((n, e) => n + countWords(e.body), 0),
      favorites: entries.filter((e) => e.favorite).length,
      photos: entries.reduce((n, e) => n + (e.photos?.length || 0), 0),
      gratitude: entries.some((e) => (e.gratitude || []).filter((g) => g.trim()).length >= 3),
      moods: new Set(entries.map((e) => e.mood).filter(Boolean)).size,
      night: hours.some((h) => h >= 21),
      early: hours.some((h) => h >= 4 && h < 8),
      prompts: entries.filter((e) => e.prompt).length,
    };
  }

  function checkStickers() {
    const s = stats();
    const fresh = STICKERS.filter((st) => !settings.stickers[st.id] && st.t(s));
    fresh.forEach((st) => { settings.stickers[st.id] = Date.now(); });
    if (fresh.length) saveSettings();
    return fresh;
  }

  function dailyPromptIndex() {
    const day = Math.floor(parseKey(todayKey()).getTime() / 86400000);
    return (day + settings.promptOffset) % PROMPTS.length;
  }

  // Past entries from the same day-of-month (last month, last year, ...)
  function onThisDay() {
    const today = parseKey(todayKey());
    return entries
      .filter((e) => {
        const d = parseKey(e.date);
        return d.getDate() === today.getDate() && d < today;
      })
      .slice(0, 3)
      .map((e) => {
        const d = parseKey(e.date);
        const months = (today.getFullYear() - d.getFullYear()) * 12 + today.getMonth() - d.getMonth();
        const label = months % 12 === 0
          ? `${months / 12} year${months / 12 > 1 ? 's' : ''} ago today`
          : `${months} month${months > 1 ? 's' : ''} ago today`;
        return { e, label };
      });
  }

  /* =========================================================
     UI: rendering, actions, toasts, modals, confetti
     ========================================================= */
  let viewActs = {};
  function render(html, nav = null) {
    app.innerHTML = `<div class="fade-in">${html}</div>${nav ? navHtml(nav) : ''}`;
    viewActs = {};
    hydratePhotos(app);
  }
  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !app.contains(el)) return;
    const fn = viewActs[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });

  function navHtml(on) {
    const link = (href, icon, text, key) =>
      `<a href="${href}" class="${on === key ? 'on' : ''}"><span class="i">${icon}</span>${text}</a>`;
    return `<nav class="nav"><div class="inner">
      ${link('#/', '🏠', 'Home', 'home')}
      ${link('#/calendar', '📅', 'Moods', 'calendar')}
      <a href="#/new" class="plus" aria-label="New entry">+</a>
      ${link('#/stickers', '🏅', 'Stickers', 'stickers')}
      ${link('#/settings', '⚙️', 'Settings', 'settings')}
    </div></nav>`;
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    t.style.animation = 'none';
    void t.offsetHeight;
    t.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2800);
  }

  function confetti(n = 28) {
    if (reducedMotion()) return;
    const box = $('#confetti');
    const bits = ['💖', '⭐', '🌸', '✨', '🌈', '🦋', '🍓', '🎀'];
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.textContent = pick(bits);
      s.style.left = Math.random() * 100 + '%';
      s.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
      s.style.animationDelay = Math.random() * 0.5 + 's';
      box.appendChild(s);
      setTimeout(() => s.remove(), 4200);
    }
  }

  function modal(html, acts = {}) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="card modal stack">${html}</div>`;
    document.body.appendChild(bg);
    const close = () => bg.remove();
    bg.addEventListener('click', (e) => {
      if (e.target === bg) return close();
      const el = e.target.closest('[data-act]');
      if (!el) return;
      if (el.dataset.act === 'close') return close();
      const fn = acts[el.dataset.act];
      if (fn) { e.preventDefault(); fn(el, close); }
    });
    return close;
  }

  /* =========================================================
     PIN pad (used by lock screen, setup and change-PIN)
     ========================================================= */
  function pinPad({ emoji, title, sub, extra = '', acts = {}, onDone }) {
    let pin = '';
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-act="k" data-k="${n}">${n}</button>`).join('');
    render(`<div class="lock">
      <div class="big-emoji">${emoji}</div>
      <div><h2 class="hand">${title}</h2><p class="muted">${sub}</p></div>
      <div class="dots" id="dots"><i></i><i></i><i></i><i></i></div>
      <div class="keypad">${keys}<span></span><button data-act="k" data-k="0">0</button><button class="ghost" data-act="del" aria-label="Delete">⌫</button></div>
      ${extra}
    </div>`);
    const dots = $('#dots');
    const update = () => dots.querySelectorAll('i').forEach((d, i) => d.classList.toggle('on', i < pin.length));
    let busy = false;
    const fail = () => {
      pin = '';
      busy = false;
      update();
      dots.classList.add('shake');
      if (navigator.vibrate) navigator.vibrate(200);
      setTimeout(() => dots.classList.remove('shake'), 420);
    };
    viewActs = {
      ...acts,
      k: (el) => {
        if (busy || pin.length >= 4) return;
        pin += el.dataset.k;
        update();
        if (pin.length === 4) { busy = true; setTimeout(() => onDone(pin, fail), 140); }
      },
      del: () => { if (!busy) { pin = pin.slice(0, -1); update(); } },
    };
  }

  /* =========================================================
     Onboarding
     ========================================================= */
  const ob = { step: 0, name: '', theme: settings.theme, pin: '', hint: '' };

  function installTipHtml(dismissible) {
    if (isStandalone() || (dismissible && settings.hideInstallTip)) return '';
    return `<div class="card small">
      <div class="row between"><b>📲 Put me on your Home Screen!</b>${dismissible ? '<button class="muted" data-act="hideTip" aria-label="Hide tip">✕</button>' : ''}</div>
      <p class="muted" style="margin:6px 0 0">In Safari, tap the <b>Share</b> button (the square with the arrow ⬆️), then tap <b>Add to Home Screen</b>. Then I open like a real app!</p>
    </div>`;
  }

  function renderOnboarding() {
    const next = () => { ob.step++; renderOnboarding(); };
    const back = () => { ob.step--; renderOnboarding(); };

    if (ob.step === 0) {
      render(`<div class="lock stack">
        <div class="big-emoji">📔</div>
        <h1 class="hand">Welcome to your journal!</h1>
        <p class="muted">A cozy, private place for your thoughts, feelings, and favorite moments. ✨<br>Everything you write stays right here on your phone.</p>
        <button class="btn block" data-act="next">Let's get started 💕</button>
        ${installTipHtml(false)}
      </div>`);
      viewActs.next = next;
    } else if (ob.step === 1) {
      render(`<div class="lock stack">
        <div class="big-emoji">👋</div>
        <h2 class="hand">What should I call you?</h2>
        <input class="input center" id="name" maxlength="30" placeholder="Your name or nickname" value="${esc(ob.name)}" autocomplete="off">
        <button class="btn block" data-act="next">Next</button>
        <button class="btn soft block" data-act="back">Back</button>
      </div>`);
      const input = $('#name');
      setTimeout(() => input.focus(), 50);
      const go = () => {
        ob.name = input.value.trim();
        if (!ob.name) { toast('Type your name first 😊'); return; }
        next();
      };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      viewActs.next = go;
      viewActs.back = back;
    } else if (ob.step === 2) {
      render(`<div class="lock stack">
        <div class="big-emoji">🎨</div>
        <h2 class="hand">Pick your colors, ${esc(ob.name)}!</h2>
        <p class="muted small">You can change this any time.</p>
        ${themePickerHtml(ob.theme)}
        <button class="btn block" data-act="next">Love it!</button>
        <button class="btn soft block" data-act="back">Back</button>
      </div>`);
      viewActs.theme = (el) => {
        ob.theme = el.dataset.theme;
        settings.theme = ob.theme;
        applyTheme();
        document.querySelectorAll('.theme-swatch').forEach((s) => s.classList.toggle('on', s.dataset.theme === ob.theme));
      };
      viewActs.next = next;
      viewActs.back = back;
    } else if (ob.step === 3) {
      pinPad({
        emoji: '🔐', title: 'Make a secret code', sub: 'Pick 4 numbers only you know',
        extra: '<button class="btn soft" data-act="back">Back</button>',
        acts: { back },
        onDone: (pin) => { ob.pin = pin; next(); },
      });
    } else if (ob.step === 4) {
      pinPad({
        emoji: '🤫', title: 'Type it one more time', sub: 'Just to be sure!',
        extra: '<button class="btn soft" data-act="back">Start over</button>',
        acts: { back },
        onDone: (pin, fail) => {
          if (pin === ob.pin) next();
          else { fail(); toast("Those didn't match. Try again!"); }
        },
      });
    } else if (ob.step === 5) {
      render(`<div class="lock stack">
        <div class="big-emoji">💭</div>
        <h2 class="hand">Add a secret hint?</h2>
        <p class="muted small">This shows up if you forget your code. Make it something only you would understand. Don't write the code itself!</p>
        <input class="input center" id="hint" maxlength="60" placeholder="e.g. my bestie's birthday" value="${esc(ob.hint)}" autocomplete="off">
        <button class="btn block" data-act="finish">Open my journal 🎉</button>
      </div>`);
      viewActs.finish = async () => {
        ob.hint = $('#hint').value.trim();
        settings = { ...settings, name: ob.name, theme: ob.theme, pinHash: await hashPin(ob.pin), pinHint: ob.hint, onboarded: true };
        saveSettings();
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
        unlocked = true;
        await loadEntries();
        location.hash = '#/';
        route();
        confetti(40);
        toast(`Yay! Welcome, ${settings.name}! 💖`);
      };
    }
  }

  function themePickerHtml(current) {
    return `<div class="themes">${THEMES.map((t) => `
      <button class="theme-swatch card ${t.id === current ? 'on' : ''}" data-act="theme" data-theme="${t.id}">
        <i style="background:${t.c}"></i>${t.n}
      </button>`).join('')}</div>`;
  }

  /* =========================================================
     Lock screen
     ========================================================= */
  let unlocked = false;
  let hiddenAt = 0;

  function renderLock() {
    pinPad({
      emoji: pick(['🌷', '🌸', '🦋', '🌈', '⭐']),
      title: `Hi${settings.name ? ', ' + esc(settings.name) : ''}!`,
      sub: 'Enter your secret code',
      extra: '<button class="btn soft" data-act="forgot">Forgot code?</button>',
      acts: { forgot: showForgot },
      onDone: async (pin, fail) => {
        if ((await hashPin(pin)) === settings.pinHash) {
          unlocked = true;
          await loadEntries();
          route();
        } else {
          fail();
        }
      },
    });
  }

  function showForgot() {
    modal(`
      <div class="s">🤔</div>
      <h2 class="hand">Forgot your code?</h2>
      ${settings.pinHint ? `<p>Your hint: <b>${esc(settings.pinHint)}</b></p>` : '<p class="muted">You didn\'t set a hint.</p>'}
      <p class="muted small">Still stuck? You can reset the app, but that <b>erases all entries</b> on this phone. If you have a backup file, you can bring them back after.</p>
      <button class="btn block" data-act="close">I'll try again</button>
      <button class="btn danger block" data-act="reset">Reset app</button>`, {
      reset: () => eraseEverything(),
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (unlocked && settings.pinHash && Date.now() - hiddenAt >= settings.lockAfter * 1000) {
      unlocked = false;
      document.querySelectorAll('.modal-bg, .lightbox').forEach((m) => m.remove());
      route();
    }
  });

  /* =========================================================
     Home
     ========================================================= */
  let homeFilter = 'all';
  let homeSearch = '';

  function renderHome() {
    const s = stats();
    const hour = new Date().getHours();
    const greet = hour < 12 ? ['Good morning', '☀️'] : hour < 17 ? ['Good afternoon', '🌼'] : ['Good evening', '🌙'];
    const day = Math.floor(Date.now() / 86400000);
    const prompt = PROMPTS[dailyPromptIndex()];
    const memories = onThisDay();
    const needsBackup = entries.length >= 3 && Date.now() - (settings.lastBackup || 0) > 30 * 86400000;
    const stickerCount = Object.keys(settings.stickers).length;

    render(`
      <div class="greet">
        <div class="date">${fmtLong(todayKey())}</div>
        <h1 class="hand">${greet[0]}, ${esc(settings.name)}! ${greet[1]}</h1>
        <div class="muted">${AFFIRMATIONS[day % AFFIRMATIONS.length]}</div>
      </div>
      <div class="stack">
        <div class="stats">
          <div class="card stat"><b>🔥 ${s.streak}</b><span>day streak</span></div>
          <div class="card stat"><b>📖 ${s.count}</b><span>entries</span></div>
          <div class="card stat"><b>🏅 ${stickerCount}</b><span>stickers</span></div>
        </div>

        <div class="card prompt-card">
          <div class="row between"><b>${s.wroteToday ? '✨ You wrote today! Want to write more?' : '💡 Today\'s prompt'}</b>
          <button class="icon-btn" data-act="shuffle" aria-label="Another prompt">🔀</button></div>
          <div class="q">${esc(prompt)}</div>
          <a class="btn block" href="#/new?p=${dailyPromptIndex()}">Write about this ✏️</a>
        </div>

        ${memories.map(({ e, label }) => `
          <a class="card memory-card entry" href="#/entry/${e.id}">
            <div class="mood">${moodOf(e.mood)?.e || '📝'}</div>
            <div class="body"><div class="meta">💌 On this day · ${label}</div>
            <div class="title">${esc(e.title || 'Untitled')}</div>
            <div class="snippet">${esc(e.body)}</div></div>
          </a>`).join('')}

        ${needsBackup ? `<div class="card small"><b>💾 Time for a backup!</b>
          <p class="muted" style="margin:6px 0 10px">Your journal only lives on this phone. Save a backup file so your entries are safe.</p>
          <button class="btn soft block" data-act="backup">Save backup</button></div>` : ''}

        ${installTipHtml(true)}

        ${entries.length ? `
          <h2 class="hand" style="margin-top:22px">My entries</h2>
          <label class="search"><input class="input" id="search" type="search" placeholder="Search my journal" value="${esc(homeSearch)}" aria-label="Search entries"></label>
          <div class="filters">
            ${[['all', 'All'], ['fav', '❤️ Favorites'], ['photos', '📸 Photos'], ...MOODS.map((m) => [m.id, m.e])]
              .map(([id, l]) => `<button class="chip ${homeFilter === id ? 'on' : ''}" data-act="filter" data-f="${id}">${l}</button>`).join('')}
          </div>
          <div id="list" class="stack"></div>` : `
          <div class="empty card"><div class="big">🌱</div><h2 class="hand">Your first page is waiting!</h2>
          <p class="muted">Tap the big <b>+</b> button to write your very first entry.</p></div>`}
      </div>`, 'home');

    viewActs.shuffle = () => { settings.promptOffset = (settings.promptOffset + 1) % PROMPTS.length; saveSettings(); renderHome(); };
    viewActs.hideTip = () => { settings.hideInstallTip = true; saveSettings(); renderHome(); };
    viewActs.backup = exportBackup;
    viewActs.filter = (el) => {
      homeFilter = el.dataset.f;
      document.querySelectorAll('.filters .chip').forEach((c) => c.classList.toggle('on', c === el));
      renderList();
    };
    const search = $('#search');
    if (search) search.addEventListener('input', () => { homeSearch = search.value; renderList(); });
    renderList();
  }

  function renderList() {
    const list = $('#list');
    if (!list) return;
    const q = homeSearch.trim().toLowerCase();
    const shown = entries.filter((e) => {
      if (homeFilter === 'fav' && !e.favorite) return false;
      if (homeFilter === 'photos' && !e.photos?.length) return false;
      if (moodOf(homeFilter) && e.mood !== homeFilter) return false;
      if (q) {
        const hay = [e.title, e.body, e.prompt, ...(e.gratitude || [])].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (!shown.length) {
      list.innerHTML = '<div class="empty muted">No entries found 🔎</div>';
      return;
    }
    let lastMonth = '';
    list.innerHTML = shown.map((e) => {
      const month = fmt(e.date, { month: 'long', year: 'numeric' });
      const header = month !== lastMonth ? `<h3 class="muted small" style="margin-top:18px">${month.toUpperCase()}</h3>` : '';
      lastMonth = month;
      return header + entryCardHtml(e);
    }).join('');
    hydratePhotos(list);
  }

  function entryCardHtml(e) {
    return `<a class="entry" href="#/entry/${e.id}">
      <div class="mood">${moodOf(e.mood)?.e || '📝'}</div>
      <div class="body">
        <div class="meta">${fmtShort(e.date)} ${e.favorite ? '❤️' : ''}</div>
        <div class="title">${esc(e.title || 'Untitled')}</div>
        <div class="snippet">${esc(e.body || (e.gratitude || []).filter(Boolean).join(' · '))}</div>
      </div>
      ${e.photos?.length ? `<img class="thumb" data-photo="${esc(e.photos[0])}" alt="">` : ''}
    </a>`;
  }

  /* =========================================================
     Editor
     ========================================================= */
  let draft = null;

  function newDraft(key, entry, q) {
    if (entry) return { key, original: entry, ...structuredClone(entry), gratitude: [...(entry.gratitude || []), '', '', ''].slice(0, 3), photos: [...(entry.photos || [])], dirty: false };
    const p = q.get('p');
    const d = q.get('d');
    return {
      key, original: null, id: null, createdAt: null,
      date: d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : todayKey(),
      mood: '', title: '', body: '', prompt: p != null && PROMPTS[+p] ? PROMPTS[+p] : '',
      gratitude: ['', '', ''], photos: [], favorite: false, dirty: false,
    };
  }

  function renderEditor(id, q) {
    const key = id || 'new';
    const entry = id ? entries.find((e) => e.id === id) : null;
    if (id && !entry) { location.replace('#/'); return; }
    // Keep an unsaved draft (e.g. after the app auto-locked); otherwise start fresh.
    if (!draft || draft.key !== key || !draft.dirty) draft = newDraft(key, entry, q);
    const d = draft;

    render(`
      <div class="topbar">
        <button class="icon-btn" data-act="cancel" aria-label="Cancel">✕</button>
        <h2 class="hand">${id ? 'Edit entry' : 'New entry'}</h2>
        <button class="btn" style="padding:10px 18px;min-height:44px" data-act="save">Save</button>
      </div>
      <div class="stack">
        <div class="row between">
          <input class="input" type="date" id="date" value="${d.date}" max="${todayKey()}" style="max-width:200px" aria-label="Date">
          <button class="icon-btn heart" data-act="fav" aria-label="Favorite" aria-pressed="${d.favorite}">${d.favorite ? '❤️' : '🤍'}</button>
        </div>

        <div class="card">
          <b>How are you feeling?</b>
          <div class="moods" style="margin-top:10px">
            ${MOODS.map((m) => `<button class="${d.mood === m.id ? 'on' : ''}" data-act="mood" data-m="${m.id}" aria-label="${m.l}">${m.e}<small>${m.l}</small></button>`).join('')}
          </div>
        </div>

        <div id="promptSlot">${promptSlotHtml()}</div>

        <input class="input" id="title" maxlength="80" placeholder="Give it a title (optional)" value="${esc(d.title)}">
        <div>
          <textarea class="textarea" id="body" placeholder="Dear journal...">${esc(d.body)}</textarea>
          <div class="muted small" id="wc" style="text-align:right;margin-top:4px"></div>
        </div>

        <div class="card">
          <b>✨ 3 good things today</b>
          <div style="margin-top:10px">
            ${[0, 1, 2].map((i) => `<label class="grat"><b>${i + 1}.</b><input class="input grat-input" data-i="${i}" maxlength="120" value="${esc(d.gratitude[i])}" placeholder="${['Something that made me happy', 'Someone I am thankful for', 'Something I did well'][i]}"></label>`).join('')}
          </div>
        </div>

        <div class="card">
          <b>📸 Photos</b>
          <div class="photos" id="photos" style="margin-top:10px"></div>
          <input type="file" id="file" accept="image/*" multiple hidden>
        </div>

        <button class="btn block" data-act="save">Save entry 💖</button>
        ${id ? '<button class="btn soft block" data-act="delete">Delete entry</button>' : ''}
      </div>`);

    const wc = $('#wc');
    const updateWc = () => { const n = countWords(d.body); wc.textContent = n ? `${n} word${n === 1 ? '' : 's'}` : ''; };
    updateWc();
    const body = $('#body');
    const grow = () => { body.style.height = 'auto'; body.style.height = Math.max(220, body.scrollHeight + 4) + 'px'; };
    grow();
    body.addEventListener('input', () => { d.body = body.value; d.dirty = true; updateWc(); grow(); });
    $('#title').addEventListener('input', (e) => { d.title = e.target.value; d.dirty = true; });
    $('#date').addEventListener('change', (e) => { if (e.target.value) { d.date = e.target.value; d.dirty = true; } });
    document.querySelectorAll('.grat-input').forEach((inp) => inp.addEventListener('input', () => { d.gratitude[+inp.dataset.i] = inp.value; d.dirty = true; }));
    $('#file').addEventListener('change', addPhotos);
    renderEditorPhotos();

    viewActs = {
      mood: (el) => {
        d.mood = d.mood === el.dataset.m ? '' : el.dataset.m;
        d.dirty = true;
        document.querySelectorAll('.moods button').forEach((b) => b.classList.toggle('on', b.dataset.m === d.mood));
      },
      fav: (el) => {
        d.favorite = !d.favorite; d.dirty = true;
        el.textContent = d.favorite ? '❤️' : '🤍';
        el.setAttribute('aria-pressed', d.favorite);
      },
      newPrompt: () => { d.prompt = pick(PROMPTS.filter((p) => p !== d.prompt)); d.dirty = true; $('#promptSlot').innerHTML = promptSlotHtml(); },
      clearPrompt: () => { d.prompt = ''; d.dirty = true; $('#promptSlot').innerHTML = promptSlotHtml(); },
      addPhoto: () => $('#file').click(),
      removePhoto: (el) => { d.photos = d.photos.filter((p) => p !== el.dataset.id); d.dirty = true; renderEditorPhotos(); },
      save: saveDraft,
      cancel: cancelDraft,
      delete: () => confirmDelete(entry),
    };
  }

  function promptSlotHtml() {
    if (!draft.prompt) return '<button class="chip" data-act="newPrompt">💡 Need an idea?</button>';
    return `<div class="prompt-pill"><span>${esc(draft.prompt)}</span>
      <span class="row" style="gap:4px;flex:none">
        <button class="icon-btn" style="width:36px;height:36px;font-size:1rem" data-act="newPrompt" aria-label="Different prompt">🔀</button>
        <button class="icon-btn" style="width:36px;height:36px;font-size:1rem" data-act="clearPrompt" aria-label="Remove prompt">✕</button>
      </span></div>`;
  }

  const MAX_PHOTOS = 6;
  function renderEditorPhotos() {
    const box = $('#photos');
    if (!box) return;
    box.innerHTML = draft.photos.map((id) => `<div class="photo"><img data-photo="${esc(id)}" alt=""><button class="x" data-act="removePhoto" data-id="${esc(id)}" aria-label="Remove photo">✕</button></div>`).join('')
      + (draft.photos.length < MAX_PHOTOS ? '<button class="add-photo" data-act="addPhoto" aria-label="Add photo">＋</button>' : '');
    hydratePhotos(box);
  }

  async function addPhotos(e) {
    const files = [...e.target.files].slice(0, MAX_PHOTOS - draft.photos.length);
    e.target.value = '';
    if (!files.length) return;
    toast('Adding photo... 📸');
    for (const f of files) {
      try {
        draft.photos.push(await savePhotoFile(f));
        draft.dirty = true;
      } catch {
        toast("Oops, couldn't add that photo");
      }
    }
    renderEditorPhotos();
  }

  async function discardDraftPhotos() {
    const keep = new Set(draft.original?.photos || []);
    await Promise.all(draft.photos.filter((p) => !keep.has(p)).map(deletePhoto));
  }

  async function cancelDraft() {
    const back = draft.original ? `#/entry/${draft.original.id}` : '#/';
    if (draft.dirty && !confirm('Leave without saving? Your changes will be lost.')) return;
    await discardDraftPhotos();
    draft = null;
    location.hash = back;
  }

  async function saveDraft() {
    const d = draft;
    const gratitude = d.gratitude.map((g) => g.trim());
    const hasContent = d.body.trim() || d.title.trim() || d.mood || gratitude.some(Boolean) || d.photos.length;
    if (!hasContent) { toast('Write a little something first ✏️'); return; }

    const now = Date.now();
    const entry = {
      id: d.id || uid(),
      date: d.date,
      createdAt: d.createdAt || now,
      updatedAt: now,
      mood: d.mood,
      title: d.title.trim(),
      body: d.body.replace(/\s+$/, ''),
      prompt: d.prompt,
      gratitude,
      photos: d.photos,
      favorite: d.favorite,
    };
    try {
      await idb.put('entries', entry);
    } catch {
      toast("Couldn't save — is your phone storage full?");
      return;
    }
    const removed = (d.original?.photos || []).filter((p) => !d.photos.includes(p));
    await Promise.all(removed.map(deletePhoto));

    entries = entries.filter((e) => e.id !== entry.id).concat(entry);
    sortEntries();
    const isNew = !d.original;
    draft = null;
    location.replace(`#/entry/${entry.id}`);

    const fresh = checkStickers();
    const tough = TOUGH_MOODS.includes(entry.mood);
    if (tough) $('#confetti').innerHTML = '';
    if (fresh.length) {
      if (!tough) confetti(50);
      showStickerModal(fresh, tough);
    } else if (tough && isNew) {
      modal(`<div class="s">🫂</div>
        <h2 class="hand">Thanks for writing it down</h2>
        <p>Tough days happen to everyone, and they don't last forever. 💛</p>
        <p class="muted small">Talking to someone you trust, like a parent, friend, or school counselor, can really help too.</p>
        <button class="btn block" data-act="close">Okay 💛</button>`);
    } else {
      if (isNew) confetti(18);
      toast(isNew ? pick(CHEERS) : 'Changes saved ✨');
    }
  }

  function showStickerModal(fresh, tough) {
    const first = fresh[0];
    modal(`<div class="s">${first.s}</div>
      <h2 class="hand">New sticker${fresh.length > 1 ? 's' : ''}!</h2>
      <p><b>${fresh.map((f) => `${f.s} ${esc(f.n)}`).join('<br>')}</b></p>
      ${tough ? '<p class="muted small">And thanks for sharing your feelings. Tough days pass. 💛</p>' : ''}
      <button class="btn block" data-act="close">Yay! 🎉</button>
      <a class="btn soft block" href="#/stickers" data-act="close">See my sticker book</a>`);
  }

  function confirmDelete(entry) {
    modal(`<div class="s">🗑️</div>
      <h2 class="hand">Delete this entry?</h2>
      <p class="muted">This can't be undone.</p>
      <button class="btn danger block" data-act="yes">Yes, delete it</button>
      <button class="btn soft block" data-act="close">Keep it</button>`, {
      yes: async (_, close) => {
        await idb.del('entries', entry.id);
        await Promise.all((entry.photos || []).map(deletePhoto));
        if (draft) { await discardDraftPhotos(); draft = null; }
        entries = entries.filter((e) => e.id !== entry.id);
        close();
        location.hash = '#/';
        toast('Entry deleted');
      },
    });
  }

  /* =========================================================
     Entry view
     ========================================================= */
  function renderEntry(id) {
    const e = entries.find((x) => x.id === id);
    if (!e) { location.replace('#/'); return; }
    const mood = moodOf(e.mood);
    const grat = (e.gratitude || []).filter(Boolean);
    render(`
      <div class="topbar">
        <a class="icon-btn" href="#/" aria-label="Back" style="text-decoration:none">←</a>
        <span></span>
        <div class="row">
          <button class="icon-btn" data-act="fav" aria-label="Favorite">${e.favorite ? '❤️' : '🤍'}</button>
          <a class="icon-btn" href="#/edit/${e.id}" aria-label="Edit" style="text-decoration:none">✏️</a>
        </div>
      </div>
      <div class="stack">
        <div class="view-head">
          ${mood ? `<div class="mood">${mood.e}</div><div class="muted small"><b>Feeling ${mood.l.toLowerCase()}</b></div>` : ''}
          <div class="muted" style="margin-top:6px"><b>${fmtLong(e.date)}</b></div>
          <h1 class="hand" style="margin-top:6px">${esc(e.title || 'Untitled')}</h1>
        </div>
        ${e.prompt ? `<div class="prompt-pill">💡 ${esc(e.prompt)}</div>` : ''}
        ${e.body ? `<div class="card view-body">${esc(e.body)}</div>` : ''}
        ${grat.length ? `<div class="card"><b>✨ Good things</b><ol style="margin:8px 0 0;padding-left:22px;line-height:1.7">${grat.map((g) => `<li>${esc(g)}</li>`).join('')}</ol></div>` : ''}
        ${e.photos?.length ? `<div class="view-photos">${e.photos.map((p) => `<img data-photo="${esc(p)}" data-act="zoom" alt="Photo">`).join('')}</div>` : ''}
        <p class="muted small center">${countWords(e.body)} words</p>
      </div>`);

    viewActs.fav = async (el) => {
      e.favorite = !e.favorite;
      el.textContent = e.favorite ? '❤️' : '🤍';
      await idb.put('entries', e);
      if (e.favorite) toast('Added to favorites ❤️');
      const fresh = checkStickers();
      if (fresh.length) { confetti(50); showStickerModal(fresh, false); }
    };
    viewActs.zoom = (el) => {
      const lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.innerHTML = `<img src="${el.src}" alt="Photo">`;
      lb.addEventListener('click', () => lb.remove());
      document.body.appendChild(lb);
    };
  }

  /* =========================================================
     Mood calendar
     ========================================================= */
  function renderCalendar(q) {
    const now = new Date();
    const m = /^\d{4}-\d{2}$/.test(q.get('m') || '') ? q.get('m') : `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    const [y, mo] = m.split('-').map(Number);
    const first = new Date(y, mo - 1, 1);
    const daysIn = new Date(y, mo, 0).getDate();
    const prev = new Date(y, mo - 2, 1);
    const next = new Date(y, mo, 1);
    const mk = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    const today = todayKey();
    const byDate = {};
    entries.forEach((e) => { (byDate[e.date] ||= []).push(e); });

    let cells = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<div class="dow">${d}</div>`).join('');
    cells += '<div class="blank"></div>'.repeat(first.getDay());
    const monthEntries = [];
    for (let i = 1; i <= daysIn; i++) {
      const k = `${y}-${pad(mo)}-${pad(i)}`;
      const list = byDate[k] || [];
      monthEntries.push(...list);
      const moodE = list.map((e) => moodOf(e.mood)?.e).find(Boolean) || (list.length ? '📝' : '');
      cells += `<button class="day ${list.length ? 'has' : ''} ${k === today ? 'today' : ''}" data-act="day" data-k="${k}" ${k > today ? 'disabled' : ''}>
        ${moodE ? `<span class="e">${moodE}</span>` : ''}<span>${i}</span></button>`;
    }

    const counts = MOODS.map((md) => ({ ...md, n: monthEntries.filter((e) => e.mood === md.id).length })).filter((x) => x.n);
    const maxN = Math.max(1, ...counts.map((c) => c.n));

    render(`
      <div class="topbar">
        <a class="icon-btn" href="#/calendar?m=${mk(prev)}" aria-label="Previous month" style="text-decoration:none">‹</a>
        <h2 class="hand">${first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
        <a class="icon-btn" href="#/calendar?m=${mk(next)}" aria-label="Next month" style="text-decoration:none">›</a>
      </div>
      <div class="stack">
        <div class="card"><div class="cal">${cells}</div></div>
        <div class="card mood-bars">
          <b>🎨 My moods this month</b>
          ${counts.length ? counts.map((c) => `<div><span style="font-size:1.4rem">${c.e}</span><span class="small" style="width:64px">${c.l}</span><div class="bar"><i style="width:${(c.n / maxN) * 100}%"></i></div><b class="small">${c.n}</b></div>`).join('')
            : '<p class="muted small">No moods yet this month. Pick a mood when you write!</p>'}
        </div>
      </div>`, 'calendar');

    viewActs.day = (el) => {
      const k = el.dataset.k;
      const list = byDate[k] || [];
      if (list.length === 1) { location.hash = `#/entry/${list[0].id}`; return; }
      if (!list.length) {
        modal(`<div class="s">📝</div><h2 class="hand">${fmtShort(k)}</h2>
          <p class="muted">Nothing written this day yet.</p>
          <a class="btn block" href="#/new?d=${k}" data-act="close">Write for this day</a>
          <button class="btn soft block" data-act="close">Close</button>`);
        return;
      }
      const close = modal(`<h2 class="hand">${fmtShort(k)}</h2>
        <div class="stack" style="text-align:left">${list.map(entryCardHtml).join('')}</div>
        <button class="btn soft block" data-act="close">Close</button>`);
      document.querySelectorAll('.modal .entry').forEach((a) => a.addEventListener('click', close));
      hydratePhotos(document.querySelector('.modal'));
    };
  }

  /* =========================================================
     Sticker book
     ========================================================= */
  function renderStickers() {
    const got = STICKERS.filter((s) => settings.stickers[s.id]).length;
    const s = stats();
    render(`
      <div class="greet center">
        <h1 class="hand">My Sticker Book 🏅</h1>
        <p class="muted"><b>${got} of ${STICKERS.length}</b> collected · best streak <b>${s.best}</b> 🔥</p>
      </div>
      <div class="stickers">
        ${STICKERS.map((st) => {
          const has = settings.stickers[st.id];
          return `<div class="card sticker ${has ? 'got' : 'locked'}"><span class="s">${st.s}</span><b>${esc(st.n)}</b><span>${has ? 'Earned ' + new Date(has).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : esc(st.h)}</span></div>`;
        }).join('')}
      </div>`, 'stickers');
  }

  /* =========================================================
     Settings
     ========================================================= */
  function renderSettings() {
    const lastBackup = settings.lastBackup ? new Date(settings.lastBackup).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'never';
    render(`
      <div class="greet"><h1 class="hand">Settings ⚙️</h1></div>
      <div class="stack">
        <div class="card">
          <label class="field"><span>My name</span><input class="input" id="name" maxlength="30" value="${esc(settings.name)}"></label>
        </div>
        <div class="card"><b>Colors</b><div style="margin-top:10px">${themePickerHtml(settings.theme)}</div></div>
        <div class="card">
          <b>🔐 Privacy</b>
          <div class="setting-row"><span>Auto-lock</span>
            <select class="input" id="lockAfter" style="width:auto">
              ${[[0, 'Right away'], [60, 'After 1 minute'], [300, 'After 5 minutes'], [900, 'After 15 minutes']].map(([v, l]) => `<option value="${v}" ${settings.lockAfter === v ? 'selected' : ''}>${l}</option>`).join('')}
            </select></div>
          <div class="setting-row"><span>Secret code</span><button class="btn soft" data-act="changePin">Change</button></div>
          <label class="field" style="margin-top:12px"><span>Code hint</span><input class="input" id="hint" maxlength="60" value="${esc(settings.pinHint)}" placeholder="Something only you understand"></label>
          <div class="setting-row"><span>Lock now</span><button class="btn soft" data-act="lock">🔒 Lock</button></div>
        </div>
        <div class="card stack">
          <b>💾 Backup</b>
          <p class="muted small" style="margin:6px 0 0">Your journal is saved only on this phone. Save a backup file (to Files, iCloud Drive, or AirDrop) so you never lose your entries. Last backup: <b>${lastBackup}</b>.</p>
          <button class="btn block" data-act="backup">Save backup</button>
          <button class="btn soft block" data-act="restore">Restore from backup</button>
          <input type="file" id="restoreFile" accept="application/json,.json" hidden>
        </div>
        ${installTipHtml(false)}
        <div class="card stack">
          <b>⚠️ Danger zone</b>
          <button class="btn danger block" data-act="erase">Erase everything</button>
        </div>
        <p class="muted small center">Made with 💖 just for you</p>
      </div>`, 'settings');

    $('#name').addEventListener('change', (e) => {
      const v = e.target.value.trim();
      if (!v) { e.target.value = settings.name; return; }
      settings.name = v; saveSettings(); applyTheme(); toast('Name saved ✨');
    });
    $('#hint').addEventListener('change', (e) => { settings.pinHint = e.target.value.trim(); saveSettings(); toast('Hint saved'); });
    $('#lockAfter').addEventListener('change', (e) => { settings.lockAfter = +e.target.value; saveSettings(); toast('Auto-lock updated'); });
    $('#restoreFile').addEventListener('change', importBackup);

    viewActs.theme = (el) => {
      settings.theme = el.dataset.theme; saveSettings(); applyTheme();
      document.querySelectorAll('.theme-swatch').forEach((s) => s.classList.toggle('on', s.dataset.theme === settings.theme));
    };
    viewActs.changePin = () => changePin(0);
    viewActs.lock = () => { unlocked = false; route(); };
    viewActs.backup = exportBackup;
    viewActs.restore = () => $('#restoreFile').click();
    viewActs.erase = () => {
      modal(`<div class="s">😱</div><h2 class="hand">Erase everything?</h2>
        <p class="muted">All entries, photos, and stickers on this phone will be deleted forever. Save a backup first if you might want them later!</p>
        <button class="btn danger block" data-act="yes">Yes, erase it all</button>
        <button class="btn soft block" data-act="close">No, keep my journal</button>`, { yes: () => eraseEverything() });
    };
  }

  let newPin = '';
  function changePin(step) {
    const cancel = { extra: '<button class="btn soft" data-act="cancel">Cancel</button>', acts: { cancel: () => renderSettings() } };
    if (step === 0) {
      pinPad({
        emoji: '🔐', title: 'Current code', sub: 'Enter your old code first', ...cancel,
        onDone: async (pin, fail) => ((await hashPin(pin)) === settings.pinHash ? changePin(1) : fail()),
      });
    } else if (step === 1) {
      pinPad({ emoji: '✨', title: 'New code', sub: 'Pick 4 new numbers', ...cancel, onDone: (pin) => { newPin = pin; changePin(2); } });
    } else {
      pinPad({
        emoji: '🤫', title: 'One more time', sub: 'Type your new code again', ...cancel,
        onDone: async (pin, fail) => {
          if (pin !== newPin) { fail(); toast("Didn't match — try again"); return; }
          settings.pinHash = await hashPin(pin); saveSettings(); newPin = '';
          renderSettings(); toast('New code saved 🔐');
        },
      });
    }
  }

  async function eraseEverything() {
    await idb.clear('entries');
    await idb.clear('photos');
    try { localStorage.removeItem(SKEY); } catch { /* ignore */ }
    location.hash = '';
    location.reload();
  }

  /* =========================================================
     Backup & restore
     ========================================================= */
  const bufToDataUrl = (buf, type) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(new Blob([buf], { type }));
  });
  const dataUrlToBuf = (url) => {
    const bin = atob(url.split(',')[1]);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.buffer;
  };

  async function exportBackup() {
    try {
      toast('Packing up your journal... 📦');
      const photos = await idb.all('photos');
      const data = {
        app: 'cute-journal',
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: { name: settings.name, theme: settings.theme, stickers: settings.stickers },
        entries,
        photos: await Promise.all(photos.map(async (p) => ({ id: p.id, type: p.type, data: await bufToDataUrl(p.data, p.type) }))),
      };
      const name = `journal-backup-${todayKey()}.json`;
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const file = new File([blob], name, { type: 'application/json' });
      let done = false;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Journal backup' });
          done = true;
        } catch (err) {
          if (err.name === 'AbortError') return;
        }
      }
      if (!done) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      }
      settings.lastBackup = Date.now();
      saveSettings();
      toast('Backup saved! 💾');
      if (location.hash.startsWith('#/settings')) renderSettings();
    } catch {
      toast("Couldn't make a backup 😕");
    }
  }

  async function importBackup(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'cute-journal' || !Array.isArray(data.entries)) throw new Error('bad file');
      for (const p of data.photos || []) await idb.put('photos', { id: p.id, type: p.type, data: dataUrlToBuf(p.data) });
      for (const en of data.entries) {
        if (en && en.id && /^\d{4}-\d{2}-\d{2}$/.test(en.date)) await idb.put('entries', en);
      }
      settings.stickers = { ...(data.settings?.stickers || {}), ...settings.stickers };
      saveSettings();
      await loadEntries();
      checkStickers();
      toast(`Restored ${data.entries.length} entries! 🎉`);
      renderSettings();
    } catch {
      toast("That doesn't look like a journal backup 🤔");
    }
  }

  /* =========================================================
     Router
     ========================================================= */
  function route() {
    applyTheme();
    if (!settings.onboarded) return renderOnboarding();
    if (!unlocked) return renderLock();
    const [path, qs] = (location.hash.slice(1) || '/').split('?');
    const parts = path.split('/').filter(Boolean);
    const q = new URLSearchParams(qs || '');
    switch (parts[0]) {
      case undefined: return renderHome();
      case 'new': return renderEditor(null, q);
      case 'edit': return renderEditor(parts[1], q);
      case 'entry': return renderEntry(parts[1]);
      case 'calendar': return renderCalendar(q);
      case 'stickers': return renderStickers();
      case 'settings': return renderSettings();
      default: location.replace('#/');
    }
  }
  window.addEventListener('hashchange', () => { window.scrollTo(0, 0); route(); });

  if (!settings.pinHash) settings.onboarded = false;
  route();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
})();
