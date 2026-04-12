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
  let isPremium = localStorage.getItem('si_premium') === '1';

  // Liest URL-Hash beim Start aus:
  //   #gift=Anna        → personalisierter Beta-Link (Name wird gespeichert)
  //   #unlock           → allgemeiner Freischalt-Link
  function checkPremiumURL() {
    const hash = window.location.hash;
    const giftMatch   = hash.match(/^#gift=([^&]+)/i);
    const unlockMatch = /^#unlock$/i.test(hash);

    if (giftMatch || unlockMatch) {
      const name = giftMatch ? decodeURIComponent(giftMatch[1]).trim() : '';
      localStorage.setItem('si_premium', '1');
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
          8:"Entscheidung", 9:"Übergang", 10:"Angst & Sicherheit" },
    en: { 1:"Inner Restlessness", 2:"Overwhelm", 3:"Tension", 4:"Exhaustion",
          5:"Sadness", 6:"Inner Emptiness", 7:"Self-Doubt",
          8:"Decision", 9:"Transition", 10:"Fear & Safety" }
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
  const VIEWS = ["ui-onboarding","ui-welcome","ui-home","ui-mood","ui-chooser","ui-run","ui-quick","ui-favorites","ui-legal"];

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
    for (let i = 1; i <= 10; i++) {
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

  for (let i = 1; i <= 10; i++) {
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
