document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const SPEED = 85;
  let lang = "de";
  let breathInterval = null;
  let currentSongAudio = null;
  let bgAudio = null;
  let quickTimerInterval = null;
  let recommendedSituation = null;
  let sessionGen = 0;

  // ── PREMIUM / BETA-ZUGANG ─────────────────────────────────────────────
  const API_BASE = 'https://seelenimpuls-app.vercel.app';

  // Price IDs (Stripe) — populated on startup from /api/prices
  let PRICE = {
    aboMonthly: '',
    aboYearly:  '',
    songSingle: '',
    songDeAll:  '',
    songEnAll:  '',
  };

  fetch(`${API_BASE}/api/prices`)
    .then(r => r.json())
    .then(data => {
      if (data.aboMonthly?.id) PRICE.aboMonthly = data.aboMonthly.id;
      if (data.aboYearly?.id)  PRICE.aboYearly  = data.aboYearly.id;
      if (data.songSingle?.id) PRICE.songSingle  = data.songSingle.id;
      if (data.songDeAll?.id)  PRICE.songDeAll   = data.songDeAll.id;
      if (data.songEnAll?.id)  PRICE.songEnAll   = data.songEnAll.id;
      window._siPriceData = data;
    })
    .catch(() => {});

  // Ablauf-Check für Gift-/Unlock-Zugänge (60 Tage)
  const GIFT_DAYS = 60;
  const _giftTs = parseInt(localStorage.getItem('si_gift_ts') || '0', 10);
  if (_giftTs > 0 && Date.now() > _giftTs + GIFT_DAYS * 86400000) {
    localStorage.removeItem('si_premium');
    localStorage.removeItem('si_gift_ts');
    localStorage.removeItem('si_premium_name');
  }
  let isPremium = localStorage.getItem('si_premium') === '1';

  // Stripe Checkout aufrufen
  async function startCheckout(priceId, mode) {
    const email = localStorage.getItem('si_email') || undefined;
    try {
      const res = await fetch(`${API_BASE}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, mode, email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert('Fehler beim Starten des Bezahlvorgangs. Bitte versuche es erneut.');
    }
  }

  // Nach erfolgreicher Zahlung: Session verifizieren
  async function handlePaymentSuccess(sessionId) {
    try {
      const res = await fetch(`${API_BASE}/api/verify?session_id=${sessionId}`);
      const data = await res.json();
      if (data.valid && data.email) {
        localStorage.setItem('si_email', data.email);
        if (data.hasSubscription || data.mode === 'subscription') {
          localStorage.setItem('si_premium', '1');
          isPremium = true;
        }
        if (data.mode === 'payment') {
          localStorage.setItem('si_purchases', JSON.stringify({
            ...(JSON.parse(localStorage.getItem('si_purchases') || '{}')),
            [sessionId]: true,
          }));
        }
      }
    } catch (e) {}
    history.replaceState(null, '', window.location.pathname);
    showPaymentSuccess();
  }

  // Abo-Status beim Start prüfen (einmal pro Session)
  async function verifySubscription() {
    const email = localStorage.getItem('si_email');
    if (!email) return;
    try {
      const res = await fetch(`${API_BASE}/api/verify?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.valid) {
        if (data.hasSubscription) {
          localStorage.setItem('si_premium', '1');
          isPremium = true;
        } else {
          localStorage.removeItem('si_premium');
          isPremium = false;
        }
      }
    } catch (e) {}
  }

  function showPaymentSuccess() {
    const el = document.createElement('div');
    el.className = 'upgrade-overlay';
    el.innerHTML =
      '<div class="upgrade-sheet">' +
        '<span class="upgrade-icon">🎉</span>' +
        '<h3 class="upgrade-title">Vielen Dank!</h3>' +
        '<p style="text-align:center;margin:12px 0 20px">Dein Zugang ist jetzt aktiv.</p>' +
        '<button class="btn-primary upgrade-btn" id="paySuccessClose">Zur App</button>' +
      '</div>';
    document.body.appendChild(el);
    el.$id = el;
    el.querySelector('#paySuccessClose').onclick = () => el.remove();
  }

  function checkPremiumURL() {
    // Stripe return after payment: ?payment=success&session_id=...
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const sessionId = params.get('session_id');
      if (sessionId) handlePaymentSuccess(sessionId);
      else { history.replaceState(null, '', window.location.pathname); showPaymentSuccess(); }
      return;
    }
    if (params.get('payment') === 'cancelled') {
      history.replaceState(null, '', window.location.pathname);
      return;
    }

    // Gift/unlock hash links: #gift=Anna or #unlock (60 days free access)
    const hash = window.location.hash;
    const giftMatch   = hash.match(/^#gift=([^&]+)/i);
    const unlockMatch = /^#unlock$/i.test(hash);
    if (giftMatch || unlockMatch) {
      const name = giftMatch ? decodeURIComponent(giftMatch[1]).trim() : '';
      localStorage.setItem('si_premium', '1');
      localStorage.setItem('si_gift_ts', Date.now().toString());
      if (name) localStorage.setItem('si_premium_name', name);
      isPremium = true;
      history.replaceState(null, '', window.location.pathname);
      showGiftWelcome(name);
    }
  }

  function showGiftWelcome(name) {
    const el = document.createElement('div');
    el.id = 'giftOverlay';
    el.innerHTML =
      '<div class="gift-sheet">' +
        '<span class="gift-icon">🎁</span>' +
        '<h3 class="gift-title">' + (name ? 'Willkommen, ' + name + '!' : 'Willkommen!') + '</h3>' +
        '<p class="gift-msg">Du hast exklusiven Zugang zu allen Inhalten freigeschaltet.<br>Viel Freude mit Seelenimpuls. 🌿</p>' +
        '<button id="btnCloseGift">Los geht\'s ✨</button>' +
      '</div>';
    document.body.appendChild(el);
    document.getElementById('btnCloseGift').addEventListener('click', () => el.remove());
  }

  checkPremiumURL();
  verifySubscription();

  // ── IMPULSES (14 pro Sprache, tagesbasiert rotierend) ─────────────────
  const impulses = {
    de: [
      "Atme tief ein. Du darfst gehalten sein.",
      "Du darfst langsam sein.",
      "Dein Herz kennt den Weg.",
      "Alles darf leicht werden.",
      "Du darfst in Sicherheit ankommen.",
      "Dieser Atemzug trägt dich.",
      "Du bist genug, genau so.",
      "Ruhe ist kein Luxus. Sie ist dein Recht.",
      "Vertrauen darf wachsen.",
      "Du bist nicht allein.",
      "Dieser Moment gehört dir.",
      "Sanftheit beginnt bei dir selbst.",
      "Alles findet seinen Weg.",
      "Du darfst ankommen."
    ],
    en: [
      "Breathe deeply in. You may be held.",
      "You may be slow.",
      "Your heart knows the way.",
      "Everything may become light.",
      "You may arrive in safety.",
      "This breath holds you.",
      "You are enough, exactly as you are.",
      "Rest is not a luxury. It is your right.",
      "Trust may grow.",
      "You are not alone.",
      "This moment belongs to you.",
      "Gentleness begins with yourself.",
      "Everything finds its way.",
      "You may arrive."
    ]
  };

  // ── SITUATION TITLES (für Mood-Empfehlung) ────────────────────────────
  const situationTitles = {
    de: { 1:"Innere Unruhe", 2:"Überforderung", 3:"Anspannung", 4:"Erschöpfung",
          5:"Traurigkeit", 6:"Innere Leere", 7:"Selbstzweifel",
          8:"Entscheidung", 9:"Übergang", 10:"Angst & Sicherheit",
          11:"Konflikte & innerer Frieden" },
    en: { 1:"Inner Restlessness", 2:"Overwhelm", 3:"Tension", 4:"Exhaustion",
          5:"Sadness", 6:"Inner Emptiness", 7:"Self-Doubt",
          8:"Decision", 9:"Transition", 10:"Fear & Safety",
          11:"Conflict & Inner Peace" }
  };

  // ── UI STRINGS ────────────────────────────────────────────────────────
  const ui = {
    de: {
      impulsLabel: "✨ Tagesimpuls",
      btnImpuls: "Neuer Impuls",
      btnMood: "Wie geht es dir gerade?",
      btnContinue: "Alle Situationen",
      btnQuick: "💨 Atemübung (3 min)",
      btnFavorites: "❤️ Meine Affirmationen",
      btnBack: "Zurück",
      btnBackBottom: "ÜBUNG BEENDEN",
      impulsDefault: "Atme tief ein.",
      headers: { b1:"🌿 Ankommen", b2:"💡 Einblick", b3:"✨ Kraftsätze", b4:"🌙 Mini-Ritual", b5:"🎶 Abschluss" },
      breathLabels: { ein:"EIN", aus:"AUS" },
      songBtn: "🎵 Gesungene Affirmation hören",
      songPlaying: "Wird abgespielt...",
      onboardingSub: "Dein persönlicher Begleiter<br>für innere Ruhe.",
      onboardingBtn: "Beginnen",
      moodTitle: "Wie fühlst du dich gerade?",
      recLabel: "Für dich empfohlen",
      startRec: "Übung starten",
      showAll: "Alle Situationen",
      quickTitle: "Atemübung",
      quickSub: "3 Minuten bewusstes Atmen",
      quickStop: "Beenden",
      favTitle: "❤️ Meine Affirmationen",
      favEmpty: "Noch keine gespeichert.<br>Tippe ♡ bei einer Affirmation.",
      streak: (n) => `🔥 ${n} Tag${n === 1 ? "" : "e"} dabei`
    },
    en: {
      impulsLabel: "✨ Daily Impulse",
      btnImpuls: "New Impulse",
      btnMood: "How are you feeling?",
      btnContinue: "All Situations",
      btnQuick: "💨 Breathing (3 min)",
      btnFavorites: "❤️ My Affirmations",
      btnBack: "Back",
      btnBackBottom: "END EXERCISE",
      impulsDefault: "Breathe deeply in.",
      headers: { b1:"🌿 Arriving", b2:"💡 Insight", b3:"✨ Power Phrases", b4:"🌙 Mini Ritual", b5:"🎶 Closing" },
      breathLabels: { ein:"IN", aus:"OUT" },
      songBtn: "🎵 Listen to Sung Affirmation",
      songPlaying: "Playing...",
      onboardingSub: "Your personal companion<br>for inner calm.",
      onboardingBtn: "Begin",
      moodTitle: "How are you feeling?",
      recLabel: "Recommended for you",
      startRec: "Start Exercise",
      showAll: "All Situations",
      quickTitle: "Breathing Exercise",
      quickSub: "3 minutes of conscious breathing",
      quickStop: "Stop",
      favTitle: "❤️ My Affirmations",
      favEmpty: "None saved yet.<br>Tap ♡ on an affirmation.",
      streak: (n) => `🔥 ${n} day${n === 1 ? "" : "s"} with you`
    }
  };

  // ── MOODS ─────────────────────────────────────────────────────────────
  const moods = {
    de: [
      { emoji:"🌊", label:"Unruhig",        situation:1  },
      { emoji:"😤", label:"Gestresst",      situation:2  },
      { emoji:"😬", label:"Angespannt",     situation:3  },
      { emoji:"😓", label:"Erschöpft",      situation:4  },
      { emoji:"😔", label:"Traurig",        situation:5  },
      { emoji:"😶", label:"Leer",           situation:6  },
      { emoji:"🤔", label:"Zweifelnd",      situation:7  },
      { emoji:"🌀", label:"Unentschlossen", situation:8  },
      { emoji:"🌱", label:"Im Wandel",      situation:9  },
      { emoji:"😰", label:"Ängstlich",      situation:10 }
    ],
    en: [
      { emoji:"🌊", label:"Restless",       situation:1  },
      { emoji:"😤", label:"Stressed",       situation:2  },
      { emoji:"😬", label:"Tense",          situation:3  },
      { emoji:"😓", label:"Exhausted",      situation:4  },
      { emoji:"😔", label:"Sad",            situation:5  },
      { emoji:"😶", label:"Empty",          situation:6  },
      { emoji:"🤔", label:"Doubtful",       situation:7  },
      { emoji:"🌀", label:"Undecided",      situation:8  },
      { emoji:"🌱", label:"In Transition",  situation:9  },
      { emoji:"😰", label:"Anxious",        situation:10 }
    ]
  };

  // Atemkreis-Schlüsselwörter (DE + EN)
  const BREATH_KW = ["atme","atem","einatmen","ausatmen","atemzüge","atemzug",
                     "breath","breathe","inhale","exhale","breathing","atemzügen"];

  // Ausatmen-Schlüsselwörter — Kreis erscheint nur nach dem Ausatmen
  const EXHALE_KW = ["ausatmen","lass das aus","durch den mund aus","breathe out","exhale"];
  function hasExhaleKW(text) {
    const lower = text.toLowerCase();
    return EXHALE_KW.some(kw => lower.includes(kw)) || /atme\b.*\baus/.test(lower);
  }

  function hasBreathKW(text) {
    const lower = text.toLowerCase();
    return BREATH_KW.some(kw => lower.includes(kw));
  }

  // ── NAVIGATION ────────────────────────────────────────────────────────
  const VIEWS = ["ui-onboarding","ui-welcome","ui-home","ui-cards","ui-worksheets","ui-worksheet","ui-mood","ui-chooser","ui-run","ui-quick","ui-favorites","ui-legal"];

  function showView(id) {
    VIEWS.forEach(v => $(v).classList.add("hidden"));
    $(id).classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  function softScroll() {
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior:"smooth" }), 150);
  }

  function stopSession() {
    sessionGen++;
    if (breathInterval)    { clearInterval(breathInterval); breathInterval = null; }
    if (quickTimerInterval){ clearInterval(quickTimerInterval); quickTimerInterval = null; }
    if (currentSongAudio)  { currentSongAudio.pause(); currentSongAudio = null; }
    if (bgAudio)           { bgAudio.pause(); bgAudio = null; }
  }

  // ── STREAK ────────────────────────────────────────────────────────────
  function updateStreak() {
    const today     = new Date().toDateString();
    const lastVisit = localStorage.getItem("si_lastVisit");
    let   streak    = parseInt(localStorage.getItem("si_streak") || "0");
    if (lastVisit !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      streak = (lastVisit === yesterday) ? streak + 1 : 1;
      localStorage.setItem("si_lastVisit", today);
      localStorage.setItem("si_streak", streak);
    }
    return streak;
  }

  function showStreak() {
    const streak = updateStreak();
    const el = $("streakDisplay");
    if (streak > 1) { el.textContent = ui[lang].streak(streak); el.classList.remove("hidden"); }
    else            { el.classList.add("hidden"); }
  }

  // ── AFFIRMATIONSKARTEN ───────────────────────────────────────────────
  const CARD_DATA = [
    { nr:1,  sit:{ de:"Innere Unruhe",        en:"Inner Restlessness" },
      txt:{ de:"Ich bin der Himmel,\nnicht die Wolken\ndarin.",
            en:"I am the sky,\nnot the clouds\npassing through." },
      accent:"#7BA3B8", bg1:"#1a2a3a", bg2:"#0d1b2a" },
    { nr:2,  sit:{ de:"Überforderung",         en:"Overwhelm" },
      txt:{ de:"Nicht alles muss\nheute gelöst sein.\nDieser Moment\nist genug.",
            en:"Not everything\nneeds to be solved\ntoday." },
      accent:"#C4A35A", bg1:"#2a2418", bg2:"#1a1610" },
    { nr:3,  sit:{ de:"Anspannung",            en:"Tension" },
      txt:{ de:"Ich darf\nweich werden.\nIch darf\nloslassen.",
            en:"I am becoming soft.\nI am letting go." },
      accent:"#A8C5D4", bg1:"#1e2d38", bg2:"#0f1920" },
    { nr:4,  sit:{ de:"Erschöpfung",           en:"Exhaustion" },
      txt:{ de:"Tief in mir\nbrennt ein\ngoldenes Licht.\nEs erlischt nicht.",
            en:"I am not empty —\nI am just finding\nmy way free." },
      accent:"#D4A84B", bg1:"#2a2210", bg2:"#1a1508" },
    { nr:5,  sit:{ de:"Traurigkeit",           en:"Sadness" },
      txt:{ de:"Komm rein,\ndu stiller Gast.\nIch halte dich.\nIch halte mich.",
            en:"Yes, come in,\nyou quiet guest.\nI'll hold you true." },
      accent:"#8B9EAF", bg1:"#1a2030", bg2:"#0d1018" },
    { nr:6,  sit:{ de:"Innere Leere",          en:"Inner Emptiness" },
      txt:{ de:"Ich bin schon da.\nIch bin schon\nganz bei mir.",
            en:"I'm already here.\nI'm already mine." },
      accent:"#9BA8B4", bg1:"#1e2228", bg2:"#10141a" },
    { nr:7,  sit:{ de:"Selbstzweifel",         en:"Self-Doubt" },
      txt:{ de:"Ich steh auf\nmeiner Seite.\nIch bin\nmein eigenes Licht.",
            en:"I am here\nand I am enough.\nLet that sink." },
      accent:"#C49A6C", bg1:"#2a1e14", bg2:"#1a120a" },
    { nr:8,  sit:{ de:"Entscheidungszweifel",  en:"Decision Doubt" },
      txt:{ de:"In meiner Tiefe\nliegt ein stiller See.\nEr kennt\ndie Antwort.",
            en:"There is a lake\ninside of me,\nso deep and clear." },
      accent:"#6A9BB5", bg1:"#142028", bg2:"#0a1218" },
    { nr:9,  sit:{ de:"Übergang & Wandel",     en:"Transition" },
      txt:{ de:"Ein Schritt.\nNur einer.\nMehr brauche\nich nicht.",
            en:"One step.\nJust one.\nThat's all I need." },
      accent:"#8AAF7A", bg1:"#1a2818", bg2:"#0d180a" },
    { nr:10, sit:{ de:"Angst",                 en:"Fear" },
      txt:{ de:"Nach dem Gewitter\nwird es still.\nEs wird immer\nstill danach.",
            en:"After the storm,\nit all grows still." },
      accent:"#B89EC4", bg1:"#221a2a", bg2:"#14101a" },
  ];

  function cgBg(card) {
    return 'radial-gradient(ellipse at 30% 20%,' + card.accent + '18,transparent 60%),' +
           'radial-gradient(ellipse at 70% 80%,' + card.accent + '10,transparent 50%),' +
           'linear-gradient(160deg,' + card.bg1 + ',' + card.bg2 + ')';
  }

  function renderCardGrid() {
    const grid = $('cgGrid');
    grid.innerHTML = '';
    CARD_DATA.forEach(card => {
      const s = card.sit[lang] || card.sit.de;
      const t = card.txt[lang] || card.txt.de;
      const a = card.accent;
      const el = document.createElement('div');
      el.className = 'cg-card';
      el.style.background = cgBg(card);
      el.innerHTML =
        '<div class="cg-grain"></div>' +
        '<div class="cg-orb" style="background:radial-gradient(ellipse,' + a + '12,transparent)"></div>' +
        '<div class="cg-content">' +
          '<div class="cg-line" style="background:linear-gradient(90deg,transparent,' + a + '60,transparent)"></div>' +
          '<div class="cg-sit" style="color:' + a + '90">' + s + '</div>' +
          '<p class="cg-text">' + t.replace(/\n/g, '<br>') + '</p>' +
          '<div class="cg-line" style="background:linear-gradient(90deg,transparent,' + a + '60,transparent);margin-top:14px"></div>' +
          '<div class="cg-brand" style="color:' + a + '50">Seelenimpuls</div>' +
        '</div>' +
        '<span class="cg-num" style="color:' + a + '30">' + card.nr + '/10</span>';
      el.addEventListener('click', () => openCardFullscreen(card));
      grid.appendChild(el);
    });
    const isDE = lang === 'de';
    $('cgTitle').textContent  = isDE ? 'Affirmationskarten'                                : 'Affirmation Cards';
    $('cgSub').textContent    = isDE ? 'Tippe auf eine Karte für die Handy-Hintergrund-Vorschau' : 'Tap a card to preview as phone wallpaper';
    $('cgSub2').textContent   = isDE ? 'Deutsch · Als Hintergrundbild speichern'           : 'English · Save as wallpaper';
    $('cgFooter').textContent = isDE ? 'Speichere deine Affirmation als Hintergrundbild'   : 'Save your affirmation as phone wallpaper';
  }

  function openCardFullscreen(card) {
    const s = card.sit[lang] || card.sit.de;
    const t = card.txt[lang] || card.txt.de;
    const a = card.accent;
    $('cgPhone').style.background = cgBg(card);
    const ln = 'linear-gradient(90deg,transparent,' + a + '60,transparent)';
    $('cgFsLine1').style.background = ln;
    $('cgFsLine2').style.background = ln;
    $('cgFsSit').style.color   = a + '90';
    $('cgFsSit').textContent   = s;
    $('cgFsText').innerHTML    = t.replace(/\n/g, '<br>');
    $('cgFsBrand').style.color = a + '50';
    $('cgFsHint').textContent  = lang === 'de' ? 'Tippe außerhalb zum Schließen' : 'Tap outside to close';
    $('cgFullscreen').classList.remove('hidden');
  }

  function openCards() {
    if (!isPremium) { showUpgradePrompt(); return; }
    renderCardGrid();
    showView('ui-cards');
  }

  // ── ARBEITSBLÄTTER ────────────────────────────────────────────────────
  const WORKSHEETS = {
    1: {
      title: "Innere Unruhe & Gedankenkarussell",
      quote: '„Der Schlüssel liegt nicht darin, die Gedanken zu stoppen, sondern den Körper zu beruhigen."',
      sections: [
        {
          heading: null,
          body: null,
          fields: [
            { type:'input', label:'Morgens:', key:'s1_f0' },
            { type:'input', label:'Tagsüber:', key:'s1_f1' },
            { type:'input', label:'Abends:', key:'s1_f2' },
          ]
        },
        {
          heading: "Was liegt unter der Unruhe?",
          body: "Frage dich sanft: Was brauche ich gerade wirklich?",
          fields: [
            { type:'checklist', label:'', options:['Klarheit über eine bestimmte Situation','Zugehörigkeit / Verbindung','Sicherheit / Kontrolle','Ruhe / Abstand'], key:'s1_f3' },
            { type:'input', label:'Etwas anderes:', key:'s1_f4' },
          ]
        },
        {
          heading: "Mein Gedankenkarussell",
          body: "Schreibe die 3 Gedanken auf, die sich am häufigsten wiederholen:",
          fields: [
            { type:'input', label:'', key:'s1_f5' },
            { type:'input', label:'', key:'s1_f6' },
            { type:'input', label:'', key:'s1_f7' },
            { type:'textarea', label:'Welches Bedürfnis steckt hinter diesen Gedanken?', key:'s1_f8', rows:4 },
          ]
        },
        {
          heading: "Mein Anker-Satz",
          body: "Wähle einen Satz, den du dir in Momenten der Unruhe sagen kannst:",
          fields: [
            { type:'checklist', label:'', options:['Ich bin hier. Ich bin sicher.','Meine Gedanken sind nicht ich.','Ich darf langsam werden.'], key:'s1_f9' },
            { type:'input', label:'Mein eigener Satz:', key:'s1_f10' },
          ]
        }
      ]
    },

    2: {
      title: "Überforderung & innerer Druck",
      quote: '„Entlastung beginnt mit einer bewussten Entscheidung. Ich muss jetzt nicht alles lösen."',
      sections: [
        {
          heading: "Brain Dump – Alles raus",
          body: "Schreibe ALLES auf, was dich gerade beschäftigt. Ohne Ordnung, ohne Bewertung:",
          fields: [
            { type:'textarea', label:'', key:'s2_f0', rows:6 },
          ]
        },
        {
          heading: "Sortierung",
          body: "Ordne jetzt die Punkte von oben ein:",
          fields: [
            { type:'cols-header', col1:'Wirklich dringend (heute/morgen)', col2:'Kann warten (diese Woche+)' },
            { type:'cols2', col1:{key:'s2_f1a'}, col2:{key:'s2_f1b'} },
            { type:'cols2', col1:{key:'s2_f2a'}, col2:{key:'s2_f2b'} },
            { type:'cols2', col1:{key:'s2_f3a'}, col2:{key:'s2_f3b'} },
            { type:'cols-header', col1:'Meine Aufgabe', col2:'Erwartung anderer' },
            { type:'cols2', col1:{key:'s2_f4a'}, col2:{key:'s2_f4b'} },
            { type:'cols2', col1:{key:'s2_f5a'}, col2:{key:'s2_f5b'} },
          ]
        },
        {
          heading: "Überforderungs-Check",
          body: "Wie überfordert fühlst du dich gerade?",
          fields: [
            { type:'range', key:'s2_f6', min_label:'gar nicht', max_label:'extrem' },
            { type:'input', label:'Was wäre EIN kleiner Schritt, der jetzt Entlastung bringt?', key:'s2_f7' },
          ]
        },
        {
          heading: "Üben: Nein sagen",
          body: "Wozu könntest du diese Woche Nein sagen?",
          fields: [
            { type:'input', label:'', key:'s2_f8' },
            { type:'input', label:'', key:'s2_f9' },
          ]
        }
      ]
    },

    3: {
      title: "Anspannung & inneres Festhalten",
      quote: '„Lösung geschieht nicht durch Willenskraft, sondern durch Sicherheit."',
      sections: [
        {
          heading: "Körper-Scan: Wo halte ich fest?",
          body: "Markiere oder notiere, wo du Anspannung spürst:",
          fields: [
            { type:'checklist', label:'', options:['Stirn / Schläfen','Kiefer / Zähne','Nacken / Schultern','Brustkorb / Zwerchfell','Bauch / Becken','Hände / Fäuste','Beine / Füße'], key:'s3_f0' },
            { type:'input', label:'Andere Stelle:', key:'s3_f1' },
          ]
        },
        {
          heading: "Spannungs-Tagebuch",
          body: "Notiere 3 Tage lang, wann Anspannung besonders stark ist:",
          fields: [
            { type:'input', label:'Tag 1 – Situation:', key:'s3_f2' },
            { type:'input', label:'Tag 1 – Körperstelle:', key:'s3_f3' },
            { type:'input', label:'Tag 2 – Situation:', key:'s3_f4' },
            { type:'input', label:'Tag 2 – Körperstelle:', key:'s3_f5' },
            { type:'input', label:'Tag 3 – Situation:', key:'s3_f6' },
            { type:'input', label:'Tag 3 – Körperstelle:', key:'s3_f7' },
          ]
        },
        {
          heading: "Meine Lösungs-Strategie",
          body: "Was hilft mir, loszulassen? (Wähle oder ergänze)",
          fields: [
            { type:'checklist', label:'', options:['Langsames, tiefes Atmen','Progressive Muskelentspannung','Warmes Bad / warme Dusche','Sanfte Bewegung / Stretching','Berührung / Selbstumarmung'], key:'s3_f8' },
            { type:'input', label:'Eigene Methode:', key:'s3_f9' },
          ]
        }
      ]
    },

    4: {
      title: "Erschöpfung & fehlende Kraft",
      quote: '„Wahre Regeneration geschieht nicht durch Ablenkung, sondern durch echtes Nichtstun."',
      sections: [
        {
          heading: "Energie-Check",
          body: "Wie voll ist dein Energie-Tank gerade?",
          fields: [
            { type:'range', key:'s4_f0', min_label:'leer', max_label:'voll' },
          ]
        },
        {
          heading: "Energie-Diebe",
          body: "Was kostet dich Kraft, ohne dir etwas zurückzugeben?",
          fields: [
            { type:'input', label:'Menschen:', key:'s4_f1' },
            { type:'input', label:'Gewohnheiten:', key:'s4_f2' },
            { type:'input', label:'Situationen:', key:'s4_f3' },
          ]
        },
        {
          heading: "Energie-Quellen",
          body: "Was gibt dir Kraft? Was füllt dich auf?",
          fields: [
            { type:'input', label:'', key:'s4_f4' },
            { type:'input', label:'', key:'s4_f5' },
          ]
        },
        {
          heading: "Echte Ruhe vs. Ablenkung",
          body: null,
          fields: [
            { type:'cols-header', col1:'Echte Ruhe (nährt mich)', col2:'Ablenkung (betäubt mich)' },
            { type:'cols2', col1:{key:'s4_f6a'}, col2:{key:'s4_f6b'} },
            { type:'cols2', col1:{key:'s4_f7a'}, col2:{key:'s4_f7b'} },
            { type:'cols2', col1:{key:'s4_f8a'}, col2:{key:'s4_f8b'} },
            { type:'input', label:'Wann habe ich zuletzt wirklich geruht (ohne Bildschirm)?', key:'s4_f9' },
          ]
        },
        {
          heading: "Mein Ruhe-Versprechen",
          body: "Ich erlaube mir jeden Tag ___ Minuten echtes Nichtstun.",
          fields: [
            { type:'input', label:'', key:'s4_f10' },
          ]
        }
      ]
    },

    5: {
      title: "Traurigkeit & leise Schwere",
      quote: '„Traurigkeit zeigt uns, was uns wirklich wichtig ist."',
      sections: [
        {
          heading: "Brief an meine Traurigkeit",
          body: 'Schreibe einen Brief an deine Traurigkeit. Beginne mit: \u201eLiebe Traurigkeit, ich sehe dich \u2026\u201c',
          fields: [
            { type:'textarea', label:'', key:'s5_f0', rows:6 },
          ]
        },
        {
          heading: "Was möchte die Traurigkeit mir zeigen?",
          body: "Frage dich sanft:",
          fields: [
            { type:'input', label:'Was vermisse ich?', key:'s5_f1' },
            { type:'input', label:'Was wurde nie ausgesprochen?', key:'s5_f2' },
            { type:'input', label:'Was braucht gerade Raum?', key:'s5_f3' },
          ]
        },
        {
          heading: "Mein Halt",
          body: "Was oder wer gibt mir Halt, wenn ich traurig bin?",
          fields: [
            { type:'input', label:'', key:'s5_f4' },
            { type:'input', label:'', key:'s5_f5' },
          ]
        }
      ]
    },

    6: {
      title: "Innere Leere & Orientierungslosigkeit",
      quote: '„Leere ist kein Mangel. Sie ist ein Übergang."',
      sections: [
        {
          heading: "Absichtsloses Tun",
          body: "Probiere diese Woche bewusst Dinge OHNE Ziel. Notiere, wie es sich anfühlt:",
          fields: [
            { type:'input',    label:'Spazieren ohne Ziel:',                  key:'s6_f0' },
            { type:'input',    label:'Malen / Zeichnen ohne Ergebnis:',       key:'s6_f1' },
            { type:'input',    label:'Musik hören ohne etwas zu suchen:',     key:'s6_f2' },
          ]
        },
        {
          heading: "Erinnerung an dein wahres Selbst",
          body: "Beantworte diese Fragen aus dem Bauch heraus:",
          fields: [
            { type:'input',    label:'Was hat mich als Kind fasziniert?',     key:'s6_f3' },
            { type:'input',    label:'Welche Träume habe ich aufgegeben?',    key:'s6_f4' },
            { type:'textarea', label:'Wer war ich, bevor ich wurde, was andere erwarteten?', key:'s6_f5', rows:3 },
          ]
        },
        {
          heading: "Mein innerer Kompass",
          fields: [
            { type:'textarea', label:'', key:'s6_f6', rows:3 },
          ]
        },
        {
          heading: null,
          fields: [
            { type:'textarea', label:'Wenn ich ganz still werde, spüre ich:', key:'s6_f7', rows:4 },
          ]
        }
      ]
    },

    7: {
      title: "Selbstzweifel & innere Unsicherheit",
      quote: '„Du kannst dem inneren Kritiker zuhören, ohne ihm zu glauben."',
      sections: [
        {
          heading: "Mein innerer Kritiker",
          body: "Welche Sätze sagt er am häufigsten?",
          fields: [
            { type:'textarea', label:'', key:'s7_f0', rows:3 },
            { type:'input',    label:'Gib ihm einen Namen (z.B. „Herr Zweifel", „die strenge Lehrerin"):', key:'s7_f1' },
          ]
        },
        {
          heading: "Woher kommt diese Stimme?",
          body: "Von wem habe ich diese Sätze zuerst gehört?",
          fields: [
            { type:'input', label:'', key:'s7_f2' },
          ]
        },
        {
          heading: "Erfolgs-Tagebuch (7 Tage)",
          body: "Schreibe jeden Abend 3 Dinge auf, die du heute geschafft hast:",
          fields: [
            { type:'textarea', label:'Tag 1:', key:'s7_f3', rows:2 },
            { type:'textarea', label:'Tag 2:', key:'s7_f4', rows:2 },
            { type:'textarea', label:'Tag 3:', key:'s7_f5', rows:2 },
            { type:'note', text:'Tag 4–7: Notiere die weiteren Tage für dich.' },
          ]
        },
        {
          heading: "Mein Gegen-Satz",
          body: "Formuliere einen Satz, der den Kritiker entkräftet:",
          fields: [
            { type:'statt', key1:'s7_f6', key2:'s7_f7' },
          ]
        }
      ]
    },

    8: {
      title: "Entscheidungszweifel & inneres Schwanken",
      quote: '„Es gibt keine falsche Entscheidung. Nur Wege, die unterschiedliche Erfahrungen ermöglichen."',
      sections: [
        {
          heading: "Meine aktuelle Entscheidung",
          body: "Worum geht es?",
          fields: [
            { type:'input', label:'', key:'s8_f0' },
          ]
        },
        {
          heading: "Option A vs. Option B",
          fields: [
            { type:'cols2', col1:{label:'Option A:', key:'s8_f1'}, col2:{label:'Option B:', key:'s8_f2'} },
            { type:'textarea', label:'', key:'s8_f3', rows:3 },
          ]
        },
        {
          heading: "Körper-Check",
          body: "Stelle dir jeden Weg vor und spüre in deinen Körper:",
          fields: [
            { type:'checklist', label:'Option A fühlt sich an wie:', options:['Weite / Öffnung','Enge / Druck','Ruhe','Unruhe','Neutral'], key:'s8_f4' },
            { type:'checklist', label:'Option B fühlt sich an wie:', options:['Weite / Öffnung','Enge / Druck','Ruhe','Unruhe','Neutral'], key:'s8_f5' },
          ]
        },
        {
          heading: "Die Münzwurf-Frage",
          body: "Wirf eine Münze. In dem Moment, wo sie in der Luft ist:",
          fields: [
            { type:'input', label:'', key:'s8_f6' },
            { type:'input', label:'Was hast du dir gewünscht, dass sie zeigt?', key:'s8_f7' },
          ]
        },
        {
          heading: "Die angstfreie Frage",
          body: "Welche Entscheidung würde ich treffen, wenn ich wüsste, dass es kein Scheitern gibt?",
          fields: [
            { type:'textarea', label:'', key:'s8_f8', rows:4 },
          ]
        }
      ]
    },

    9: {
      title: "Übergang, Wandel & Neubeginn",
      quote: '„Vertrauen wächst durch die Erinnerung an alle Übergänge, die du bereits gemeistert hast."',
      sections: [
        {
          heading: "Meine bisherigen Übergänge",
          body: "Liste alle großen Veränderungen, die du bereits durchlebt hast:",
          fields: [
            { type:'input', label:'', key:'s9_f0' },
            { type:'input', label:'', key:'s9_f1' },
            { type:'input', label:'', key:'s9_f2' },
            { type:'note', text:'Bei jedem einzelnen wusstest du am Anfang nicht, wie es ausgeht. Und doch bist du hier.' },
          ]
        },
        {
          heading: "Abschiedsritual",
          fields: [
            { type:'cols-header', col1:'Was ich mitnehme:', col2:'Was ich zurücklasse:' },
            { type:'cols2', col1:{label:'', key:'s9_f3'}, col2:{label:'', key:'s9_f4'} },
            { type:'cols2', col1:{label:'', key:'s9_f5'}, col2:{label:'', key:'s9_f6'} },
            { type:'cols2', col1:{label:'', key:'s9_f7'}, col2:{label:'', key:'s9_f8'} },
          ]
        },
        {
          heading: "Brief an mein zukünftiges Ich",
          body: "Schreibe dir selbst einen Brief aus der Perspektive von 1 Jahr später:",
          fields: [
            { type:'textarea', label:'', key:'s9_f9', rows:6 },
          ]
        },
        {
          heading: "Mein Vertrauens-Satz",
          fields: [
            { type:'input', label:'', key:'s9_f10' },
          ]
        },
        {
          heading: null,
          fields: [
            { type:'textarea', label:'Ich bin bereit, weil:', key:'s9_f11', rows:4 },
          ]
        }
      ]
    },

    10: {
      title: "Angst & innere Sicherheit",
      quote: '„Nach der Angst kommt immer Stille. Es wird immer ruhig danach."',
      sections: [
        {
          heading: "Angst-Landkarte",
          body: "Schreibe deine Ängste auf und ordne sie ein:",
          fields: [
            { type:'cols-header', col1:'Reale Bedrohung', col2:'Vorgestellte Bedrohung' },
            { type:'cols2', col1:{label:'', key:'s10_f0'}, col2:{label:'', key:'s10_f1'} },
            { type:'cols2', col1:{label:'', key:'s10_f2'}, col2:{label:'', key:'s10_f3'} },
            { type:'cols2', col1:{label:'', key:'s10_f4'}, col2:{label:'', key:'s10_f5'} },
            { type:'note', text:'Die meisten Ängste fallen in die rechte Spalte. Das macht sie nicht weniger real, aber es verändert den Umgang.' },
          ]
        },
        {
          heading: "Meine Angst-Symptome",
          body: "Wie zeigt sich Angst in meinem Körper?",
          fields: [
            { type:'checklist', label:'', options:['Herzklopfen','Enge in der Brust','Flacher Atem','Schweißausbrüche','Übelkeit','Weiche Knie','Gedächtnisleere'], key:'s10_f6' },
            { type:'input', label:'Anderes:', key:'s10_f7' },
          ]
        },
        {
          heading: "5-4-3-2-1 Notfall-Übung",
          body: "Fülle aus, wenn Angst akut wird:",
          fields: [
            { type:'input', label:'5 Dinge, die ich SEHE:',          key:'s10_f8'  },
            { type:'input', label:'4 Dinge, die ich HÖRE:',          key:'s10_f9'  },
            { type:'input', label:'3 Dinge, die ich BERÜHREN kann:', key:'s10_f10' },
            { type:'input', label:'2 Dinge, die ich RIECHE:',        key:'s10_f11' },
            { type:'input', label:'1 Ding, das ich SCHMECKE:',       key:'s10_f12' },
          ]
        },
        {
          heading: "Mein Sicherheits-Anker",
          body: "Was gibt mir sofort ein Gefühl von Sicherheit?",
          fields: [
            { type:'textarea', label:'', key:'s10_f13', rows:3 },
          ]
        }
      ]
    },

    11: {
      title: "Konflikte & innerer Frieden",
      quote: '„Der wichtigste Schritt in jedem Konflikt ist nicht die Lösung, sondern die Pause."',
      sections: [
        {
          heading: "Mein aktueller Konflikt",
          body: "Beschreibe kurz die Situation (ohne Bewertung, nur Fakten):",
          fields: [
            { type:'textarea', label:'', key:'s11_f0', rows:3 },
          ]
        },
        {
          heading: "Was fühle ich wirklich?",
          body: "Was war mein erstes Gefühl – noch bevor ich etwas gesagt habe?",
          fields: [
            { type:'checklist', label:'', options:['Wut','Trauer','Angst','Scham','Hilflosigkeit','Enttäuschung'], key:'s11_f1' },
            { type:'input', label:'Anderes:', key:'s11_f2' },
          ]
        },
        {
          heading: "Was brauche ich eigentlich?",
          body: "Welches Bedürfnis steht hinter meinem Gefühl?",
          fields: [
            { type:'checklist', label:'', options:['Gehört werden','Respekt','Sicherheit','Zugehörigkeit','Autonomie','Anerkennung','Ehrlichkeit','Nähe'], key:'s11_f3' },
            { type:'input', label:'Anderes:', key:'s11_f4' },
          ]
        },
        {
          heading: "Rosenberg-Übersetzung",
          body: "Übersetze den Vorwurf in ein Bedürfnis:",
          fields: [
            { type:'textarea', label:'Was die andere Person gesagt/getan hat:', key:'s11_f5', rows:2 },
            { type:'textarea', label:'Was sie damit vielleicht eigentlich gemeint hat:', key:'s11_f6', rows:2 },
            { type:'textarea', label:'Was ICH eigentlich sagen wollte:', key:'s11_f7', rows:2 },
            { type:'textarea', label:'Was ich damit eigentlich brauche:', key:'s11_f8', rows:2 },
          ]
        },
        {
          heading: "Die 90-Sekunden-Regel",
          body: "Probiere diese Woche: Wenn du getriggert wirst, warte 90 Sekunden. Notiere deine Erfahrung:",
          fields: [
            { type:'input',    label:'Situation:', key:'s11_f9' },
            { type:'input',    label:'Was ich normalerweise sofort gesagt/getan hätte:', key:'s11_f10' },
            { type:'textarea', label:'Was ich nach 90 Sekunden stattdessen getan habe:', key:'s11_f11', rows:2 },
            { type:'textarea', label:'Wie hat sich das angefühlt?', key:'s11_f12', rows:2 },
          ]
        },
        {
          heading: "Körper-Check im Konflikt",
          body: "Wo spüre ich den Konflikt in meinem Körper?",
          fields: [
            { type:'checklist', label:'', options:['Kiefer/Zähne zusammengepresst','Schultern hochgezogen','Enge in der Brust','Hitze im Gesicht','Knoten im Bauch','Kloß im Hals','Flaue Knie','Zitternde Hände'], key:'s11_f13' },
            { type:'input', label:'Anderes:', key:'s11_f14' },
          ]
        },
        {
          heading: "Mein Friedens-Satz",
          body: "Wähle oder formuliere einen Satz für Konfliktsituationen:",
          fields: [
            { type:'checklist', label:'', options:['Frieden beginnt in mir.','Ich muss nicht gewinnen, um wertvoll zu sein.','Ich antworte aus der Stille, nicht aus dem Sturm.'], key:'s11_f15' },
            { type:'input', label:'Mein eigener Satz:', key:'s11_f16' },
          ]
        }
      ]
    }
  };

  let currentWorksheet = null;

  function wsEscape(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }

  function wsFieldHTML(field) {
    const lsKey = 'ws_' + field.key;

    if (field.type === 'input') {
      const val = wsEscape(localStorage.getItem(lsKey) || '');
      return (field.label ? '<label class="ws-field-label">' + field.label + '</label>' : '') +
        '<input type="text" class="ws-input" data-ws-key="' + field.key + '" value="' + val + '" autocomplete="off">';
    }

    if (field.type === 'textarea') {
      const val = localStorage.getItem(lsKey) || '';
      return (field.label ? '<label class="ws-field-label">' + field.label + '</label>' : '') +
        '<textarea class="ws-textarea" data-ws-key="' + field.key + '" rows="' + (field.rows || 3) + '">' + wsEscape(val) + '</textarea>';
    }

    if (field.type === 'note') {
      return '<p class="ws-note">' + field.text + '</p>';
    }

    if (field.type === 'cols-header') {
      return '<div class="ws-cols-header">' +
        '<span class="ws-cols-header-label">' + field.col1 + '</span>' +
        '<span class="ws-cols-header-label">' + field.col2 + '</span>' +
        '</div>';
    }

    if (field.type === 'cols2') {
      const v1 = wsEscape(localStorage.getItem('ws_' + field.col1.key) || '');
      const v2 = wsEscape(localStorage.getItem('ws_' + field.col2.key) || '');
      return '<div class="ws-cols2">' +
        '<div>' +
          (field.col1.label ? '<span class="ws-col-label">' + field.col1.label + '</span>' : '') +
          '<input type="text" class="ws-col-input" data-ws-key="' + field.col1.key + '" value="' + v1 + '">' +
        '</div>' +
        '<div>' +
          (field.col2.label ? '<span class="ws-col-label">' + field.col2.label + '</span>' : '') +
          '<input type="text" class="ws-col-input" data-ws-key="' + field.col2.key + '" value="' + v2 + '">' +
        '</div>' +
        '</div>';
    }

    if (field.type === 'checklist') {
      const checked = JSON.parse(localStorage.getItem('ws_' + field.key) || '[]');
      let html = (field.label ? '<span class="ws-field-label">' + field.label + '</span>' : '') +
        '<div class="ws-check-grid">';
      field.options.forEach(opt => {
        const isChecked = checked.includes(opt) ? ' checked' : '';
        html += '<label class="ws-check-item"><input type="checkbox" data-ws-key="' + field.key + '" data-ws-opt="' + wsEscape(opt) + '"' + isChecked + '> ' + opt + '</label>';
      });
      html += '</div>';
      return html;
    }

    if (field.type === 'statt') {
      const v1 = wsEscape(localStorage.getItem('ws_' + field.key1) || '');
      const v2 = wsEscape(localStorage.getItem('ws_' + field.key2) || '');
      return '<div class="ws-statt-row">Statt \u201e<input type="text" class="ws-statt-input" data-ws-key="' + field.key1 + '" value="' + v1 + '">\u201c sage ich: \u201e<input type="text" class="ws-statt-input" data-ws-key="' + field.key2 + '" value="' + v2 + '">\u201c</div>';
    }

    if (field.type === 'range') {
      const val = localStorage.getItem('ws_' + field.key) || '5';
      return '<div class="ws-range-wrap">' +
        '<span class="ws-range-edge">' + (field.min_label || 'gar nicht') + '</span>' +
        '<input type="range" class="ws-range" min="1" max="10" value="' + val + '" data-ws-key="' + field.key + '">' +
        '<span class="ws-range-edge">' + (field.max_label || 'extrem') + '</span>' +
      '</div>';
    }

    return '';
  }

  function renderWorksheet(n) {
    const ws = WORKSHEETS[n];
    let html = '<div class="ws-header">';
    html += '<span class="ws-sit-label">SITUATION ' + n + '</span>';
    html += '<h2 class="ws-main-title">' + ws.title + '</h2>';
    html += '<p class="ws-quote">' + ws.quote + '</p>';
    html += '</div>';

    ws.sections.forEach(section => {
      html += '<div class="ws-section">';
      if (section.heading) html += '<h3 class="ws-section-heading">' + section.heading + '</h3>';
      if (section.body)    html += '<p class="ws-section-body">' + section.body + '</p>';
      section.fields.forEach(field => { html += wsFieldHTML(field); });
      html += '</div><hr class="ws-divider">';
    });

    $("worksheetContent").innerHTML = html;

    // Attach auto-save listeners
    $("worksheetContent").querySelectorAll('[data-ws-key]').forEach(el => {
      if (el.type === 'checkbox') {
        el.addEventListener('change', () => {
          const key = 'ws_' + el.dataset.wsKey;
          const cur = JSON.parse(localStorage.getItem(key) || '[]');
          const opt = el.dataset.wsOpt;
          if (el.checked) { if (!cur.includes(opt)) cur.push(opt); }
          else { const i = cur.indexOf(opt); if (i !== -1) cur.splice(i, 1); }
          localStorage.setItem(key, JSON.stringify(cur));
        });
      } else {
        el.addEventListener('input', () => {
          localStorage.setItem('ws_' + el.dataset.wsKey, el.value);
        });
      }
    });
  }

  function renderWorksheetList() {
    const list = $("worksheetsList");
    list.innerHTML = "";
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach(n => {
      const ws = WORKSHEETS[n];
      const hasData = Object.keys(localStorage).some(k => k.startsWith('ws_s' + n + '_'));
      const btn = document.createElement("button");
      btn.className = "ws-list-item";
      btn.innerHTML =
        '<div>' +
          '<span class="ws-list-num">SITUATION ' + n + '</span>' +
          '<span class="ws-list-title">' + ws.title + '</span>' +
        '</div>' +
        (hasData ? '<span class="ws-list-dot"></span>' : '<span class="ws-list-arrow">›</span>');
      btn.addEventListener("click", () => openWorksheet(n));
      list.appendChild(btn);
    });
  }

  function openWorksheet(n) {
    currentWorksheet = n;
    renderWorksheet(n);
    showView('ui-worksheet');
  }

  function openWorksheets() {
    if (!isPremium) { showUpgradePrompt(); return; }
    renderWorksheetList();
    showView('ui-worksheets');
  }

  function _fmtPrice(pd) {
    if (!pd || !pd.amount) return '';
    const eur = (pd.amount / 100).toFixed(2).replace('.', ',');
    if (pd.interval === 'month') return eur + '\u00a0€/Monat';
    if (pd.interval === 'year')  return eur + '\u00a0€/Jahr';
    return eur + '\u00a0€';
  }

  function showUpgradePrompt() {
    if ($('upgradeOverlay')) return;
    const pd = window._siPriceData || {};
    const mLabel = _fmtPrice(pd.aboMonthly) || '2,99\u00a0€/Monat';
    const yLabel = _fmtPrice(pd.aboYearly)  || '19,99\u00a0€/Jahr';
    const el = document.createElement('div');
    el.id = 'upgradeOverlay';
    el.className = 'upgrade-overlay';
    el.innerHTML =
      '<div class="upgrade-sheet">' +
        '<button class="upgrade-close" id="upgradeClose">✕</button>' +
        '<span class="upgrade-icon">✨</span>' +
        '<h3 class="upgrade-title">Seelenimpuls Premium</h3>' +
        '<ul class="upgrade-list">' +
          '<li>💫 Affirmationskarten</li>' +
          '<li>📝 Arbeitsblätter für alle Situationen</li>' +
          '<li>📖 Tiefgang-Texte & Hintergrundwissen</li>' +
          '<li>🎵 Premium-Songs zu jeder Situation</li>' +
          '<li>🧘 Geführte Meditationen</li>' +
        '</ul>' +
        '<button class="btn-primary upgrade-btn" id="btnAboMonthly">✨ Monatsabo – ' + mLabel + '</button>' +
        '<button class="btn-secondary upgrade-btn" id="btnAboYearly" style="margin-top:10px">🌟 Jahresabo – ' + yLabel + '</button>' +
        '<p style="text-align:center;margin-top:16px;font-size:0.85em">' +
          '<a href="#" id="btnRestoreAccess" style="color:var(--text-secondary);text-decoration:underline">Zugang bereits erworben? Wiederherstellen</a>' +
        '</p>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelector('#upgradeClose').onclick = () => el.remove();
    el.addEventListener('click', e => { if (e.target === el) el.remove(); });
    el.querySelector('#btnAboMonthly').onclick = () => { el.remove(); startCheckout(PRICE.aboMonthly, 'subscription'); };
    el.querySelector('#btnAboYearly').onclick  = () => { el.remove(); startCheckout(PRICE.aboYearly,  'subscription'); };
    el.querySelector('#btnRestoreAccess').onclick = e => { e.preventDefault(); el.remove(); showRestoreAccess(); };
  }

  function showRestoreAccess() {
    const el = document.createElement('div');
    el.id = 'restoreOverlay';
    el.className = 'upgrade-overlay';
    el.innerHTML =
      '<div class="upgrade-sheet">' +
        '<button class="upgrade-close" id="restoreClose">✕</button>' +
        '<span class="upgrade-icon">🔑</span>' +
        '<h3 class="upgrade-title">Zugang wiederherstellen</h3>' +
        '<p style="text-align:center;margin:12px 0 16px">Gib deine E-Mail-Adresse ein, mit der du bezahlt hast.</p>' +
        '<input type="email" id="restoreEmail" placeholder="deine@email.de" style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--border);background:var(--bg-secondary);color:var(--text-primary);font-size:1rem;box-sizing:border-box">' +
        '<button class="btn-primary upgrade-btn" id="btnRestoreCheck" style="margin-top:12px">Zugang prüfen</button>' +
        '<p id="restoreMsg" style="text-align:center;margin-top:12px;font-size:0.9em;min-height:1.2em"></p>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelector('#restoreClose').onclick = () => el.remove();
    el.addEventListener('click', e => { if (e.target === el) el.remove(); });
    el.querySelector('#btnRestoreCheck').onclick = async () => {
      const email = el.querySelector('#restoreEmail').value.trim().toLowerCase();
      if (!email) return;
      const msg = el.querySelector('#restoreMsg');
      const btn = el.querySelector('#btnRestoreCheck');
      btn.disabled = true;
      msg.textContent = 'Wird geprüft\u2026';
      try {
        const res  = await fetch(`${API_BASE}/api/verify?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.valid && data.hasSubscription) {
          localStorage.setItem('si_email', email);
          localStorage.setItem('si_premium', '1');
          isPremium = true;
          el.remove();
          showPaymentSuccess();
        } else {
          msg.textContent = 'Kein aktiver Zugang für diese E-Mail gefunden.';
          btn.disabled = false;
        }
      } catch (err) {
        msg.textContent = 'Fehler beim Prüfen. Bitte versuche es erneut.';
        btn.disabled = false;
      }
    };
  }

  // ── DAILY IMPULSE ─────────────────────────────────────────────────────
  function getDailyImpulse() {
    const dayIdx = Math.floor(Date.now() / 86400000);
    const list   = impulses[lang];
    return list[dayIdx % list.length];
  }

  // ── FAVORITES ─────────────────────────────────────────────────────────
  function getFavorites() { return JSON.parse(localStorage.getItem("si_favorites") || "[]"); }

  function toggleFavorite(text) {
    const favs = getFavorites();
    const idx  = favs.indexOf(text);
    if (idx === -1) favs.push(text); else favs.splice(idx, 1);
    localStorage.setItem("si_favorites", JSON.stringify(favs));
    updateFavBtn();
  }

  function updateFavBtn() {
    $("btnFavorites").style.display = getFavorites().length > 0 ? "" : "none";
  }

  function renderFavorites() {
    const favs      = getFavorites();
    const container = $("favoritesList");
    $("favTitle").innerHTML = ui[lang].favTitle;
    if (favs.length === 0) {
      container.innerHTML = `<p class="fav-empty">${ui[lang].favEmpty}</p>`;
      return;
    }
    container.innerHTML = "";
    favs.forEach(text => {
      const div = document.createElement("div");
      div.className = "fav-item";
      const span = document.createElement("span");
      span.textContent = text;
      const btn = document.createElement("button");
      btn.className = "fav-delete";
      btn.textContent = "🗑️";
      btn.onclick = () => { toggleFavorite(text); renderFavorites(); };
      div.appendChild(span);
      div.appendChild(btn);
      container.appendChild(div);
    });
  }

  // ── COMPLETION ANIMATION ──────────────────────────────────────────────
  function showCompletion() {
    const overlay  = $("completionOverlay");
    overlay.innerHTML = "";
    const sparkles = ["✨","🌸","💫","⭐","🌟","✨","💫","🌸","⭐","✨","🌟","💫"];
    sparkles.forEach((s, i) => {
      const el = document.createElement("span");
      el.className = "sparkle";
      el.textContent = s;
      el.style.left  = (10 + Math.random() * 80) + "%";
      el.style.bottom = (15 + Math.random() * 35) + "%";
      el.style.animationDelay = (i * 0.15) + "s";
      overlay.appendChild(el);
    });
    setTimeout(() => { overlay.innerHTML = ""; }, 3800);
  }

  // ── MOOD GRID ─────────────────────────────────────────────────────────
  function renderMoodGrid() {
    const grid = $("moodGrid");
    grid.innerHTML = "";
    moods[lang].forEach(mood => {
      const btn = document.createElement("button");
      btn.className = "mood-btn";
      btn.innerHTML = `<span class="mood-emoji">${mood.emoji}</span><span class="mood-label">${mood.label}</span>`;
      btn.onclick = () => {
        document.querySelectorAll(".mood-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        recommendedSituation = mood.situation;
        $("recTitle").textContent = situationTitles[lang][mood.situation];
        $("moodRecommendation").classList.remove("hidden");
      };
      grid.appendChild(btn);
    });
  }

  // ── HOME SCREEN ───────────────────────────────────────────────────────
  // Zeigt den Emoji-Auswahlscreen (Zustand 1)
  function renderHomeScreen() {
    $("homeMoodSection").classList.remove("hidden");
    $("homeRecSection").classList.add("hidden");
    $("homeMoodHeading").textContent = ui[lang].btnMood;
    recommendedSituation = null;
    window.scrollTo(0, 0);

    const grid = $("homeMoodGrid");
    grid.innerHTML = "";
    moods[lang].forEach(mood => {
      const btn = document.createElement("button");
      btn.className = "mood-btn";
      btn.innerHTML = `<span class="mood-emoji">${mood.emoji}</span><span class="mood-label">${mood.label}</span>`;
      btn.onclick = () => selectMood(mood.situation);
      grid.appendChild(btn);
    });
  }

  // Nach Emoji-Auswahl: Seite wechselt zu Empfehlung + alle anderen Situationen
  function selectMood(situationN) {
    recommendedSituation = situationN;
    $("homeMoodSection").classList.add("hidden");
    $("homeRecSection").classList.remove("hidden");
    $("homeRecLabel").textContent = ui[lang].recLabel;
    $("homeRecTitle").textContent = situationTitles[lang][situationN];

    const list = $("homeSituationsList");
    list.innerHTML = "";
    for (let i = 1; i <= 11; i++) {
      if (i === situationN) continue;
      const btn = document.createElement("button");
      btn.className   = "home-situation-btn";
      btn.textContent = `${i}) ${situationTitles[lang][i]}`;
      btn.onclick     = () => runSituation(i);
      list.appendChild(btn);
    }
    window.scrollTo(0, 0);
  }

  // ── LANGUAGE ──────────────────────────────────────────────────────────
  function setLang(newLang) {
    lang = newLang;
    $("lang-de").classList.toggle("active", lang === "de");
    $("lang-en").classList.toggle("active", lang === "en");

    document.querySelectorAll("[data-de]").forEach(el => {
      el.textContent = el.getAttribute("data-" + lang);
    });

    const t = ui[lang];
    $("impulsLabel").textContent        = t.impulsLabel;
    $("btnImpuls").textContent          = t.btnImpuls;
    $("btnQuick").textContent           = t.btnQuick;
    $("btnFavorites").textContent       = t.btnFavorites;
    $("btnCards").textContent           = lang === "de" ? "💫 Affirmationskarten" : "💫 Affirmation Cards";
    $("btnWorksheets").textContent      = lang === "de" ? "📝 Arbeitsblätter" : "📝 Worksheets";
    if (!$("ui-cards").classList.contains("hidden")) renderCardGrid();
    $("btnBackFromChooser").textContent = t.btnBack;
    $("btnBackFromMood").textContent    = t.btnBack;
    $("btnBackFromFavorites").textContent = t.btnBack;
    $("btnBackBottom").textContent      = t.btnBackBottom;
    $("moodTitle").textContent          = t.moodTitle;
    $("recLabel").textContent           = t.recLabel;
    $("btnStartRec").textContent        = t.startRec;
    $("btnShowAll").textContent         = t.showAll;
    $("quickTitle").textContent         = t.quickTitle;
    $("quickSub").textContent           = t.quickSub;
    $("btnStopQuick").textContent       = t.quickStop;
    $("onboardingSub").innerHTML        = t.onboardingSub;
    $("btnOnboarding").textContent      = t.onboardingBtn;
    $("impuls").textContent = getDailyImpulse();
    renderMoodGrid();
    renderHomeScreen();
    showStreak();
  }

  // ── BREATHING TEXT ────────────────────────────────────────────────────
  function showBreathBox() {
    const box = $("breathBox");
    if (!box || getComputedStyle(box).display !== "none") return;
    box.style.display  = "block";
    box.style.opacity  = "0";
    setTimeout(() => {
      box.style.transition = "opacity 2s ease-in-out";
      box.style.opacity    = "1";
    }, 50);
  }

  function startBreathingText() {
    if (breathInterval) { clearInterval(breathInterval); breathInterval = null; }
    const colorEin = "#0056b3";
    const colorAus = "#2d5a27";

    const update = () => {
      // Feste Atemkreise (Quick-Mode & breathBox)
      ["breathLabel","quickBreathLabel"].forEach(id => {
        const el = $(id);
        if (!el) return;
        el.textContent  = ui[lang].breathLabels.ein;
        el.style.color  = colorEin;
        setTimeout(() => {
          if (el) { el.textContent = ui[lang].breathLabels.aus; el.style.color = colorAus; }
        }, 4000);
      });
      // Inline-Atemkreise im Ritual
      document.querySelectorAll(".inline-breath-lbl").forEach(el => {
        el.textContent = ui[lang].breathLabels.ein;
        el.style.color = colorEin;
        setTimeout(() => {
          el.textContent = ui[lang].breathLabels.aus;
          el.style.color = colorAus;
        }, 4000);
      });
    };
    update();
    breathInterval = setInterval(update, 8000);
  }

  // ── TYPE EFFECTS ──────────────────────────────────────────────────────
  // alive() = function that returns false when the session has been cancelled.
  // Breath detection is intentionally absent here – prose text never triggers the circle.
  async function typeEffect(id, text, alive) {
    const el = $(id);
    if (!el) return;
    el.innerHTML = `<span style="opacity:0">${text}</span>`;
    const vis = document.createElement("span");
    vis.style.cssText = "position:absolute; left:0; top:0;";
    el.appendChild(vis);

    let current = "";
    for (let char of text) {
      if (!alive()) return;
      current += char;
      vis.textContent = current;
      if ([".", "!", "?"].includes(char)) { softScroll(); await sleep(700); }
      await sleep(SPEED);
    }
    softScroll();
  }

  // opts.breath = true  → einmal pro Ritual den Atemkreis zeigen (beim ersten Atemschritt)
  // opts.hearts = true  → ❤️ Speichern-Button (nur Affirmationen)
  async function typeListEffect(id, items, opts = {}, alive) {
    const list = $(id);
    if (!list) return;
    list.innerHTML = "";
    let breathShown = false; // nur ein Kreis pro Ritual

    for (let item of items) {
      if (!alive()) return;
      const li = document.createElement("li");
      list.appendChild(li);

      li.innerHTML = `<span style="opacity:0">${item}</span>`;
      const vis = document.createElement("span");
      vis.style.cssText = "position:absolute; left:35px; top:0;";
      li.appendChild(vis);

      let current = "";
      for (let char of item) {
        if (!alive()) return;
        current += char;
        vis.textContent = current;
        await sleep(SPEED);
      }

      // Inline-Atemkreis: nur beim ersten Atemschritt im Ritual
      if (opts.breath && !breathShown && hasExhaleKW(item)) {
        breathShown = true;
        const breathDiv = document.createElement("div");
        breathDiv.className = "inline-breath";
        breathDiv.innerHTML =
          `<div class="inline-breath-circle-sm">` +
          `<span class="inline-breath-lbl">${ui[lang].breathLabels.ein}</span>` +
          `</div>`;
        breathDiv.style.cssText = "opacity:0; transition:opacity 1.5s ease-in-out; padding:14px 0 6px; text-align:center;";
        li.appendChild(breathDiv);
        setTimeout(() => { breathDiv.style.opacity = "1"; }, 80);
        startBreathingText();
        softScroll();
        // 3 vollständige Atemzyklen pausieren (3 × 8s = EIN + AUS je Zyklus)
        for (let cycle = 0; cycle < 3; cycle++) {
          await sleep(8000);
          if (!alive()) return;
        }
      }

      // Herzchen für Affirmationen (b3)
      if (opts.hearts) {
        const heart = document.createElement("button");
        heart.className   = "heart-btn";
        heart.textContent = getFavorites().includes(item) ? "❤️" : "🤍";
        heart.onclick     = () => {
          toggleFavorite(item);
          heart.textContent = getFavorites().includes(item) ? "❤️" : "🤍";
        };
        li.appendChild(heart);
      }

      softScroll();
      await sleep(3500);
    }
  }

  // ── RUN SITUATION ─────────────────────────────────────────────────────
  async function runSituation(n) {
    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) return;

    // stopSession() increments sessionGen – capture AFTER so alive() tracks this run
    stopSession();
    const myGen = sessionGen;
    const alive = () => sessionGen === myGen;

    const t = (field) => (lang === "en" && s[field + "_en"]) ? s[field + "_en"] : s[field];
    const headers = ui[lang].headers;

    showView("ui-run");

    bgAudio = new Audio("audio/stillness-space.mp3");
    bgAudio.loop = true;
    bgAudio.volume = 0.15;
    bgAudio.play().catch(() => {});

    ["b1","b2","b3","b4","b5"].forEach(id => $(id).classList.add("hidden"));
    $("audioContainer").innerHTML = "";
    $("volumeRow").classList.add("hidden");
    $("lyricsBox").style.display = "none";

    const bBox = $("breathBox");
    bBox.style.display = "none"; bBox.style.opacity = "0"; bBox.style.transition = "";

    ["b1","b2","b3","b4","b5"].forEach(id => $(id).querySelector(".block-header").textContent = headers[id]);

    // 1. ANKOMMEN
    $("b1").classList.remove("hidden");
    await typeEffect("t1", t("ankommenText"), alive);
    if (!alive()) return;
    await sleep(1000);

    // 2. EINBLICK
    if (t("erklaerungText")) {
      if (!alive()) return;
      $("b2").classList.remove("hidden");
      await typeEffect("t2", t("erklaerungText"), alive);
      if (!alive()) return;
      await sleep(1000);
    }

    if ([1,2,10].includes(n)) { softScroll(); if (!alive()) return; await sleep(1000); }

    // 3. KRAFTSÄTZE
    if (t("affirmations")) {
      if (!alive()) return;
      $("b3").classList.remove("hidden");
      await typeListEffect("t3", t("affirmations"), { hearts: true }, alive);
      if (!alive()) return;
      await sleep(1000);
    }

    // 4. MINI-RITUAL – Atemkreis erscheint nur hier
    if (t("ritual")) {
      if (!alive()) return;
      $("b4").classList.remove("hidden");
      await typeListEffect("t4", t("ritual"), { breath: true }, alive);
      if (!alive()) return;
      await sleep(1000);
    }

    // 5. ABSCHLUSS
    if (!alive()) return;
    if (t("songOutro")) {
      $("b5").classList.remove("hidden");
      await typeEffect("t5", t("songOutro"), alive);
      if (!alive()) return;

      if (s.songFile) {
        $("volumeRow").classList.remove("hidden");
        const btn = document.createElement("button");
        btn.className = "btn-primary";
        btn.style.marginTop = "16px";
        btn.innerHTML = `<span>${ui[lang].songBtn}</span>`;
        btn.onclick = () => {
          if (bgAudio) { bgAudio.pause(); bgAudio = null; }
          currentSongAudio = new Audio(s.songFile);
          currentSongAudio.volume = parseFloat($("volumeSlider").value);
          currentSongAudio.play();
          btn.disabled = true;
          btn.innerHTML = `<span>${ui[lang].songPlaying}</span>`;

          if (s.lyrics) {
            $("lyricsBox").style.display = "block";
            $("lyricsContent").innerText = s.lyrics;
            softScroll();
          }
        };
        $("audioContainer").appendChild(btn);
        softScroll();
      }
    }

    // ── PREMIUM BLOCKS ────────────────────────────────────────────────
    if (isPremium && alive()) {
      const tiefgang = t('tiefgangText');
      if (tiefgang) {
        await sleep(800);
        $('b6').classList.remove('hidden');
        $('t6').innerHTML = tiefgang.split('\n\n').map(p =>
          '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');
        softScroll();
        await sleep(400);
      }
      const lyrics = s.songLyrics_en;
      const songTitle = s.songTitle_en || '';
      if (lyrics && alive()) {
        await sleep(600);
        $('b7').classList.remove('hidden');
        if (songTitle) $('t7title').textContent = '\u201c' + songTitle + '\u201d';
        $('t7').textContent = lyrics;
        // Add premium song play button if file is available
        const premiumFile = lang === 'de' ? s.premiumSongFile_de : s.premiumSongFile_en;
        const premiumFileEn = s.premiumSongFile_en;
        const fileToPlay = premiumFile || premiumFileEn;
        if (fileToPlay) {
          const pBtn = document.createElement('button');
          pBtn.className = 'btn-primary';
          pBtn.style.marginTop = '16px';
          pBtn.innerHTML = '<span>🎵 ' + (songTitle || 'Premium Song') + ' abspielen</span>';
          pBtn.onclick = () => {
            if (bgAudio) { bgAudio.pause(); bgAudio = null; }
            if (currentSongAudio) { currentSongAudio.pause(); currentSongAudio = null; }
            currentSongAudio = new Audio(fileToPlay);
            const vol = $('volumeSlider');
            currentSongAudio.volume = vol ? parseFloat(vol.value) : 0.7;
            currentSongAudio.play().catch(() => {});
            pBtn.disabled = true;
            pBtn.innerHTML = '<span>🎵 ' + (songTitle || 'Premium Song') + ' \u2013 spielt\u2026</span>';
          };
          $('b7').appendChild(pBtn);
        }
        softScroll();
      }
    }

    if (alive()) showCompletion();
  }

  // ── QUICK MODE ────────────────────────────────────────────────────────
  function startQuickMode() {
    stopSession();
    showView("ui-quick");
    $("quickTitle").textContent = ui[lang].quickTitle;
    $("quickSub").textContent   = ui[lang].quickSub;

    bgAudio = new Audio("audio/stillness-space.mp3");
    bgAudio.loop = true;
    bgAudio.volume = 0.15;
    bgAudio.play().catch(() => {});

    let remaining = 180;
    const fmt = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;
    $("quickTimer").textContent = fmt(remaining);

    startBreathingText();

    quickTimerInterval = setInterval(() => {
      remaining--;
      $("quickTimer").textContent = fmt(remaining);
      if (remaining <= 0) {
        stopSession();
        showCompletion();
        showView("ui-home");
        showStreak();
      }
    }, 1000);
  }

  // ── INIT ──────────────────────────────────────────────────────────────
  renderMoodGrid();
  renderHomeScreen();
  updateFavBtn();
  $("impuls").textContent = getDailyImpulse();

  if (!localStorage.getItem("si_visited")) {
    localStorage.setItem("si_visited", "1");
    showView("ui-onboarding");
  } else {
    showView("ui-welcome");
    showStreak();
  }

  // ── EVENT LISTENERS ───────────────────────────────────────────────────
  $("lang-de").onclick = () => setLang("de");
  $("lang-en").onclick = () => setLang("en");

  $("btnOnboarding").onclick = () => { showView("ui-welcome"); showStreak(); };
  $("btnBeginnen").onclick   = () => { renderHomeScreen(); showView("ui-home"); updateFavBtn(); };

  $("btnImpuls").onclick = async () => {
    const el = $("impuls");
    el.style.opacity = "0";
    await sleep(500);
    const list = impulses[lang];
    el.textContent   = list[Math.floor(Math.random() * list.length)];
    el.style.opacity = "1";
  };

  $("btnBackFromMoodSection").addEventListener("click", () => { showView("ui-welcome"); showStreak(); });
  $("btnBackFromRec").addEventListener("click", () => { renderHomeScreen(); });
  $("btnDailyRec").onclick            = () => { if (recommendedSituation) runSituation(recommendedSituation); };
  $("btnCards").addEventListener("click", () => openCards());
  $("btnBackFromCards").addEventListener("click", () => { showView("ui-welcome"); showStreak(); });
  $("cgFullscreen").addEventListener("click", (e) => {
    if (e.target === $("cgFullscreen") || e.target === $("cgModal")) $("cgFullscreen").classList.add("hidden");
  });

  $("btnWorksheets").addEventListener("click", () => openWorksheets());
  $("btnBackFromWorksheets").addEventListener("click", () => { showView("ui-welcome"); showStreak(); });
  $("btnBackFromWorksheet").addEventListener("click", () => openWorksheets());
  $("btnBackFromWorksheetBottom").addEventListener("click", () => openWorksheets());

  $("btnQuick").onclick         = () => startQuickMode();
  $("btnFavorites").onclick     = () => { renderFavorites(); showView("ui-favorites"); };

  $("btnBackFromMood").onclick  = () => showView("ui-home");
  $("btnShowAll").onclick       = () => showView("ui-chooser");
  $("btnStartRec").onclick      = () => { if (recommendedSituation) runSituation(recommendedSituation); };

  $("btnBackFromChooser").onclick = () => showView("ui-home");
  $("btnBackBottom").onclick    = () => { stopSession(); renderHomeScreen(); showView("ui-home"); showStreak(); };
  $("btnStopQuick").onclick     = () => { stopSession(); renderHomeScreen(); showView("ui-home"); showStreak(); };
  $("btnBackFromFavorites").onclick = () => { updateFavBtn(); showView("ui-home"); };
  $("btnLegal").onclick             = () => showView("ui-legal");
  $("btnBackFromLegal").onclick     = () => showView("ui-home");

  $("volumeSlider").oninput = (e) => {
    if (currentSongAudio) currentSongAudio.volume = parseFloat(e.target.value);
  };

  for (let i = 1; i <= 11; i++) {
    const btn = $("btnSituation" + i);
    if (btn) btn.onclick = () => runSituation(i);
  }

  // ── PWA Install Button ──────────────────────────────────────────────────
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let deferredInstallPrompt = null;

  if (!isStandalone) {
    if (isIOS) {
      $("btnInstall").style.display = "block";
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      $("btnInstall").style.display = "block";
    });
  }

  $("btnInstall").onclick = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      $("btnInstall").style.display = "none";
    } else if (isIOS) {
      $("iosInstallModal").classList.add("visible");
    }
  };

  $("btnCloseIosModal").onclick = () => $("iosInstallModal").classList.remove("visible");

  // ── SW Update Notification ────────────────────────────────────────────
  // When the page's service worker controller changes (new SW took over),
  // show a banner so users know a new version is ready.
  if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      $("updateBanner").classList.remove("hidden");
    });
    $("btnUpdate").onclick = () => location.reload();
  }

});
